const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ciyoo.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('doctors_portal').collection('services');
        const bookingCollection = client.db('doctors_portal').collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services);
        });

        app.get('/available', async (req, res) => {
            const date = req.query.date;

            const services = await serviceCollection.find().toArray();

            const query = { date: date };
            const bookings = await bookingCollection.find(query).toArray();

            services.forEach(service => {
                const serviceBookings = bookings.filter(book => book.treatment === service.name);

                const booked = serviceBookings.map(book => book.slot);
                const available = service.slots.filter(slot => !booked.includes(slot));

                service.slots = available;
            })

            res.send(services);
        });

        app.post('/bookings', async (req, res) => {
            const newBooking = req.body;
            const query = { treatment: newBooking.treatment, date: newBooking.date, patient: newBooking.patient };
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(newBooking);
            res.send({ success: true, result });
        });
    }
    finally {

    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from Doctors Portal');
});

app.listen(port, () => {
    console.log('Listening from port', port);
});