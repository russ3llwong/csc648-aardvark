const express = require ('express');
const sqlRouter = express.Router();
const db = require('../model/db.js');
const bodyparser = require('body-parser');
const init = require('../model/init.js');

const multer = require('multer');
const Jimp = require('jimp');

const storage = multer.diskStorage({
	destination(req, file, cb) {
		cb(null, 'uploads');
	},
	filename(req, file, cb) {
		cb(null, `${file.fieldname}-${Date.now()}`);
	},
});

const imgUpload = multer({storage});

// parser to parse request body form-data
let parser = bodyparser.urlencoded({extended: false});

let app = express();
app.use(parser);

// if go straight to searchResults page via URL, no data is passed onto views
sqlRouter.get("/", (req, res) => {
    res.render("results", {
        searchTerm: "",
        searchResults: "",
        type: ""
    })
});

// search bar action type is POST
sqlRouter.post("/", parser, (req,res) => {

    // get request body form-data from index.ejs 
    let searchTerm = req.body.search;
    let type = req.body.type;

    // search logic
    // status=1 for approved items
    let query = "SELECT * FROM item WHERE status =1;";
    if (searchTerm != '' && type != ''){
        query = `SELECT * FROM item WHERE status=1 AND type="${type}" AND ( name LIKE "%${searchTerm}%" OR description LIKE "%${searchTerm}%");`
    }
    else if (searchTerm != '' && type == ''){
        query = `SELECT * FROM item WHERE status=1 AND name LIKE "%${searchTerm}%" OR description LIKE "%${searchTerm}%";`
    }
    else if (searchTerm == '' && type != ''){
        query = `SELECT * FROM item WHERE status=1 AND type="${type}";`
    }

    // print db query for debugging purposes
    console.log(query);

    // db query to get results
    db.query(query, (err, result) => {
        if (err) {
            console.log(err);
            // data is null in case of error
            req.searchResult = "";
            req.searchTerm = "";
            req.type = "";
        }

        req.searchResult = result;
        req.searchTerm = searchTerm;
        req.type = type;

		console.log(`searchTerm: ${searchTerm}, type: ${type}`);
		//console.log(result);

        // searchTerm for what was typed into the search bar
        // type for the type selected, null if All Types
        // searchResults is the array of items. 
        var imgblobs = [];
        for(var i = 0; i<result.length; i++) {
            imgblobs [i] = new Buffer( result[i].itemImage, 
                'binary').toString('base64');
          }

        res.render("results", {
            page: "home",
            searchTerm: req.searchTerm,
            searchResults: req.searchResult,
            imgblobs: imgblobs,
            type: req.type
        })
    })
})

// for single item/product page
sqlRouter.get('/:id(\\d+)', parser, (req, res) => {

	query = `SELECT * FROM item WHERE status=1 AND id=${req.params.id};`;

	console.log(`query for single item: ${query}`);

	db.query(query, (err, result) => {

        if (err) {
            console.log(`error: ${err}`);
            req.result = "";
        }

			req.result = result;
			console.log(req.result);

			let imgBlob = new Buffer( result[0].itemImage, 'binary').toString('base64');

        res.render("product", {
            page: "home",
            item: req.result,
            img: imgBlob,
		})
	})
})

async function makeImage(path){
	try{
		const imgBuffer = await Jimp.read(path)
		.then(lenna => lenna
			.resize(1000, Jimp.AUTO)
			.quality(80)
			.getBufferAsync(Jimp.MIME_JPEG));
			return imgBuffer;
	}
	catch(err){
		return 'err';
	}
}

sqlRouter.post("/createItem", parser, imgUpload.single('itemImage'), (req,res) => {
	(async() => {
		let item = req.body.nameofitem;
		let price = req.body.price;
		let itemType = req.body.type;
		let itemD = req.body.item_description;
		console.log(item + " " +price + " " + itemType + " " + itemD);

		let itemImage;
		if (req.file) {
			itemImage = await makeImage(req.file.path);
		}

		if(req.body.type == 'texts'){
			let data = {
				userId: '1',
				name: req.body.nameofitem,
				description: req.body.item_description,
				price: req.body.price,
				type: req.body.type,
				status: '0',
				itemImage: itemImage
			};
			console.log(itemImage);
			db.query("INSERT INTO item SET ?", data);
		}
		else if (req.body.type == 'school supplies'){
			let data = {
				userId: '2',
				name: req.body.nameofitem,
				description: req.body.item_description,
				price: req.body.price,
				type: req.body.type,
				status: '0',
				itemImage: itemImage
			};
			console.log(itemImage);
			db.query("INSERT INTO item SET ?", data);
		}
		else if (req.body.type == 'home goods'){
			let data = {
				userId: '3',
				name: req.body.nameofitem,
				description: req.body.item_description,
				price: req.body.price,
				type: req.body.type,
				status: '0',
				itemImage: itemImage
			};
			console.log(itemImage);
			db.query("INSERT INTO item SET ?", data);
		}
		//console.log();
		res.redirect('/');
	})();
});

//for routing user product page--> contact page
/* app.post('contact', function(req, res){
	console.log(req.body.Contact);
	 res.redirect('/');
}) */

// for testing
sqlRouter.route('/tables').get((req, res) => {
    (async () => {
      await init.CreateTables();
      res.send('Created Tables.');
    })();
  });

// for testing
 sqlRouter.route('/insert').get((req, res) => {
    (async () => {
      await init.InsertDummy();
      res.send('Inserted Data');
    })();
  });

module.exports = sqlRouter;