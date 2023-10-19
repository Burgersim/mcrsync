const express = require('express')
const app = express()
const port = process.env.PORT || 8080
const path = require("path");
const cron = require('node-cron')
const mcrSync = require("./functions/mcrSync");

app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('json spaces', 2);
app.set('views', './views')
app.set('view engine', 'pug');

app.get('/', (req, res) => {

    if(req.query.mode === 'rbtv')
            res.render("index", {title: "MCR Sync", mode: 'rbtv'})
    else if(req.query.mode === 'stv')
            res.render("index", {title: "MCR Sync", mode: 'stv'})
    else
        res.status(500).send("Page does not exist without proper parameters")
})

app.get('/request', async (req, res) => {

        let time = await mcrSync(req.query.mode).catch(err => {console.error((err))})
        res.json(time)
    })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})


cron.schedule('0 6,12,18,0 * * *', () => {
    if(process.env.RBTV_SCHEDULING === "true"){
        mcrSync('rbtv').catch(err => {console.error(err)})
    }
    if(process.env.STV_SCHEDULING === "true"){
        mcrSync('stv').catch(err => {console.error(err)})
    }
})

