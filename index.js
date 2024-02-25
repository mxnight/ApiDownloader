const request = require('request');
const fs = require('fs');
const qrate = require('qrate')
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const type = 'coffee'
const website = `https://nekobot.xyz/api/image`

const dir = 'data'
const delay = 400
let processed_tbl = []
let url = 'http'
let amount = 0
let skipped = 0
let qrate_tbl

if (!fs.existsSync(__dirname + `/${dir}`)) {
    fs.mkdirSync(__dirname + `/${dir}`);
}

const get_count = async () => {
    return new Promise((resolve, reject) => {
        request(website, { json: true }, (err, _res, body) => {
            if (err) return reject(err);
            if (!body.stats[type]) return reject("Api fetch error");
            resolve(body.stats[type])
        })
    }).catch((e) => {console.log(e)})
};

const process_data = (data, done) => {
    request(website + `?type=${type}`, { json: true }, (err, _res, body) => {
        if (err) { return console.log(err); }
        url = body.message;
        if (processed_tbl.includes(url)) {
            amount = amount + 1
            skipped = skipped + 1
            qrate_tbl.push(amount);
            console.log("Skipped duplicate")
            setTimeout(done, delay);
        } else {
            processed_tbl.push(url)
            const name = `${type}_` + ('0' + (parseInt(data)-skipped)).slice(-3);
            const format = url.substring(url.lastIndexOf(".") + 1);
            download(url, __dirname + `/data/${name}.${format}`);
            if (!url.startsWith('http')) { setTimeout(done, 75000); } else { setTimeout(done, delay); }
        }
    })
}; 
 
const execute = async () => {
    amount = await get_count()
    console.log(`Count - ${amount}`)
    qrate_tbl = qrate(process_data, 1, 4)
    for (let i = 1; i <= amount; i++) {
        qrate_tbl.push(i);
    }

    qrate_tbl.drain = () => {
        console.log(`Finished downloading ${amount-skipped} files`)
        process.exit(1)
    }
}
execute()

const download = async (url, name) => {
    await fetch(url)
        .then(res => res.body.pipe(fs.createWriteStream(name)),
            console.log(`Successfully downloaded - ${name}`)
        )
        .catch(() => { });
}