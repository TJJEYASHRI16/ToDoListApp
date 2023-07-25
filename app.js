//jshint esversion:6
//declarations
const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");

const mongoose = require('mongoose');
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
//connect to db
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/toDoListDB');
}

main().catch(err => console.log(err));

//schema
const itemsSchema = new mongoose.Schema({
  name: String
});

//model
const Item = mongoose.model("item", itemsSchema);

// //add items to database
const item1 = new Item({
  name: "Welcome to the ToDoList Page"
});
const item2 = new Item({
  name: "Press the + Button to add to your list"
});

const item3 = new Item({
  name: "Click the checkbox to remove from the list"
});

const defaultItems = [item1, item2, item3];


const ListSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("list", ListSchema);
//get starting point
app.get("/", async function (req, res) {

  const foundItems = await Item.find();
  // console.log(foundItems);

  //insert only if database is empty

  if (foundItems.length === 0) {
    Item.insertMany(defaultItems);
    res.redirect("/");
  } else {
    res.render("list", {
      listTitle: "TODAY",
      newListItems: foundItems
    });
  }



});
//post request
app.post("/", async function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.listName;
  console.log(listName);
  const newItem = new Item({
    name: itemName
  });

  if (listName === "TODAY") {
    newItem.save();
    res.redirect("/");
  } else {
    const listFind = await List.findOne({
      name: listName
    });
    listFind.items.push(newItem);
    listFind.save();
    console.log("listfind" + listFind);
    res.redirect("/" + listName);
  }



});
//delete gets called when checkbox is ciciked clicked
app.post("/delete", async function (req, res) {

  const id = req.body.checkbox;
  const listDelete = req.body.ListToDelete;
  if (listDelete === "TODAY") {
    await Item.findByIdAndRemove(id);
    res.redirect("/");
  } else {
    await List.findOneAndUpdate({
        name: listDelete
      }, // The filter: Find the document with the given name
      {
        $pull: {
          items: {
            _id: id
          }
        }
      }, {
        new: true
      } // The update: Pull (remove) the item with the given _id from the 'items' array
    );
    res.redirect("/" + listDelete);
  }


});



app.get('/:customList', async function (req, res) {
  const customListName = _.capitalize(req.params.customList);

  const findList = await List.findOne({
    name: customListName
  });

  if (findList === null) {
    const customList = new List({
      name: customListName,
      items: defaultItems
    });


    customList.save();
    res.redirect("/" + customListName);
  } else {
    res.render("list", {
      listTitle: customListName,
      newListItems: findList.items
    });
  }

});




app.listen(3000, function () {
  console.log("Server started on port 3000");
});
