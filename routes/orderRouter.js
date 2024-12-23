const orderRouter = require('express').Router()
const xml2js = require('xml2js');

const User = require("../models/userModel")
const Order = require("../models/orderModel")
const Product = require("../models/productModel")

const {generateOrderNumber, createInvoice, quantityProducts, handleNullableField} = require("../vars/functions")

const orderValidator = require("../validators/orderValidator")
const monobankValidator = require("../validators/monobankValidator")

const {monoXSIGN, mongoUri, monoURL, monoWEBHOOK, ukrPochta, iban} = require("../vars/privateVars")
const axios = require("axios");

//POST
orderRouter.post('/ukrpochta', async (req, res) => {
    const {city} = req.body
    try {
        if (!city) return res.status(400).json({error: "Треба вказати назву міста"})

        let cities = await axios.get(`${ukrPochta}/get_city_by_region_id_and_district_id_and_city_ua?city_ua=${city}`,
            {
                headers: {
                    'Authorization': "Bearer cadc506b-4be0-3663-8a2f-b1f6c71a90a1",
                    "Accept": "application/xml",
                }
            })

        let offices = []
        xml2js.parseString(cities.data, async (err, result) => {
            if (err) {
                console.error("Error parsing XML:", err)
                return
            }

            result = result.Entries.Entry

            if (!result) return res.status(404).json({error: "Місто не знайдено"})

            await Promise.all(result?.map(async (city) => {
                const office = await axios.get(`${ukrPochta}/get_postoffices_by_postcode_cityid_cityvpzid?city_id=${city.CITY_ID.toString()}`, {
                    headers: {
                        'Authorization': "Bearer cadc506b-4be0-3663-8a2f-b1f6c71a90a1",
                        "Accept": "application/xml",
                    }
                })

                xml2js.parseString(office.data, (err, result) => {
                    if (err) {
                        console.error("Error parsing XML:", err)
                        return
                    }

                    result = result.Entries.Entry
                    const data = result?.map((office) => {
                        if (office.LOCK_CODE.toString() === '0') {
                            return {
                                id: office.POSTOFFICE_ID.toString(),
                                postCode: office.POSTCODE.toString(),
                                adress: handleNullableField(office.STREET_UA_VPZ, "Невідомо вулицю")
                            }
                        }
                    }).filter(item => item)

                    const response = {
                        city: {
                            id: city.CITY_ID.toString(),
                            name: city.CITY_UA.toString(),
                            region: city.REGION_UA.toString(),
                        },
                        postOffices: data
                    }

                    offices.push(response)
                })
            }))

            return res.status(200).json(offices)
        })
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

orderRouter.post("/order", orderValidator, async (req, res) => {
    const {
        localStorage,
        cost,
        fullname,
        phone,
        deliveryType,
        city,
        address,
        customerComment,
        managerComment,
        paymentMethod
    } = req.body

    try {
        const bulkOps = await quantityProducts(localStorage)
        const orderNumber = generateOrderNumber()
        const order = new Order({
            orderNumber: orderNumber,
            localStorage: localStorage,
            cost: cost,
            fullname: fullname,
            phone: phone,
            deliveryType: deliveryType,
            city: city,
            address: address,
            customerComment: customerComment,
            managerComment: managerComment,
        })
        if (paymentMethod === "Mono") {
            const {invoiceId, pageUrl} = await createInvoice(cost)
            order.invoiceId = invoiceId
            res.json({
                message: "Замовлення успішно створено",
                order: order,
                pageUrl: pageUrl
            })
        } else {
            res.json({
                message: "Замовлення успішно створене",
                order: order,
                iban: {
                    message: "Вам потрібно надіслати квитанцію про оплату в форматі PDF",
                    iban: iban
                }
            })
        }

        await order.save()

        await User.updateOne(
            {phone: phone},
            {$push: {history: order._id}}
        )

        await Product.bulkWrite(bulkOps)

        return res.status(201)
    } catch (e) {
        return res.status(500).json({error: e.message})
    }
})

orderRouter.post("/pay-status", monobankValidator, async (req, res) => {
    const {invoiceId} = req.body;
    try {
        await axios.get(
            `${monoURL}/invoice/status`,
            {
                headers: {
                    "X-Token": monoXSIGN
                },
                params: {invoiceId}
            }
        ).then(async response => {
            if (response.data.status === "expired") {
                await Order.updateOne({invoiceId: invoiceId}, {status: "cancelled"})
                return res.status(200).header("X-Sign", monoXSIGN).json({message: "Updated"})
            } else if (response.data.status === "success") {
                await Order.updateOne({invoiceId: invoiceId}, {
                    payment: true,
                    status: "inProcess"
                })
                return res.status(200).header("X-Sign", monoXSIGN).json({message: "Updated"})
            }
        }).catch(e => {
            throw new Error(e)
        })
        return res.status(400)
    } catch (e) {
        return res.status(500)
    }
})


module.exports = orderRouter