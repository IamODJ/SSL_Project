const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();
const fileUpload = require('express-fileupload');
const morgan = require('morgan');
const cors = require('cors');
const _ = require('lodash');
const { forEach } = require("lodash");

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Enables the file uploading
app.use(fileUpload());

app.use(cors());
app.use(bodyParser.json());
app.use(morgan('dev'));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

mongoose.connect("mongodb://localhost:27017/lib_manage", { useNewUrlParser: true });
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
    console.log("Connection Successful!");
});



const bookSchema = new mongoose.Schema({
    book_name: String,
    book_author: String,
    book_ISBN: String,
    book_genre: String
});
const Book = new mongoose.model("Book", bookSchema);
const book1 = new Book({
    book_name: "CLRS",
    book_author: "Cormen",
    book_ISBN: "2222",
    book_genre: "Algo"
})
const book2 = new Book({
    book_name: "Physics",
    book_author: "HCV",
    book_ISBN: "3333",
    book_genre: "IIT"
})

const libSchema = new mongoose.Schema({
    book: bookSchema,
    count: Number
});
const Lib = new mongoose.model("Lib", libSchema);
const entry1 = new Lib({
    book: book1,
    count: 3
});
const entry2 = new Lib({
    book: book2,
    count: 3
});

const studentSchema = new mongoose.Schema({
    student_name: String,
    student_rollno: Number,
    student_due: Number,
    // book_issued: bookSchema
});
const Student = new mongoose.model("Student", studentSchema);
const student1 = new Student({
    student_name: "Manav",
    student_rollno: 190010023,
    student_due: 23
});
const student2 = new Student({
    student_name: "Pratik",
    student_rollno: 190010034,
    student_due: 34
});


const issuedBookSchema = new mongoose.Schema({
    issued_rollno: String,
    issued_ISBN: String
});
const Issue = new mongoose.model("Issue", issuedBookSchema);
// const firstIssue = new Issue({
//     issued_rollno: student1.student_rollno,
//     issued_ISBN: book1.book_ISBN
// });
Book.find({}, function (err, found) {
    if (!err) {
        if (found.length === 0) {
            book1.save();
            book2.save();
        }
    }
    else console.log(err);
})
Lib.find({}, function (err, found) {
    if (!err) {
        if (found.length === 0) {
            entry1.save();
            entry2.save();
        }
    }
    else console.log(err);
})
Student.find({}, function (err, found) {
    if (!err) {
        if (found.length === 0) {
            student2.save();
            student1.save();
        }
    }
    else console.log(err);
})
// Issue.find({}, function (err, found) {
//     if (!err) {
//         if (found.length === 0) {
//             firstIssue.save();
//         }
//     }
//     else console.log(err);
// })




// var bname = "physi";
// bname = (_.toLower(bname));
// console.log(bname);

//================================================== Searching a book ==================================
app.post("/search", function (req, res) {
    // const bname = _.lowerCase(req.body.book_name);
    const bname = (req.body.book_name);
    console.log(bname);

    Lib.find({ 'book.book_name': { $regex: bname } }, function (err, found) {
        var returnObject = {
            Status: true,
            Books: [],
            StatusMessage: "Found the books"
        }
        var ret = [];
        if (err) {
            console.log(err);
            res.send({
                Status: false,
                Books: [],
                StatusMessage: err
            });
        }
        else {
            console.log(found);
            found.forEach(function (item) {
                var obj = {
                    "book_name": _.startCase(item.book.book_name),
                    "book_ISBN": item.book.book_ISBN,
                    "book_author": item.book.book_author,
                    "book_genre": item.book.book_genre,
                    "book_count": item.count
                }
                returnObject.Books.push(obj);
            });
            res.send(returnObject);
        }
    });
});


//================================================= Add a book to library ==============================
app.post("/addBook", function (req, res) {
    const bISBN = _.toUpper(req.body.book_ISBN);
    Book.findOne({ book_ISBN: bISBN }, function (err, found) {
        var returnObject = {
            Status: true,
            StatusMessage: "Added the book to the library"
        };

        if (!err) {

            if (!found) {
                const incrementValue = req.body.count;
                const inbook = new Book({
                    book_name: req.body.book_name,
                    book_author: req.body.book_author,
                    book_ISBN: req.body.book_ISBN,
                    book_genre: req.body.book_genre,
                })
                inbook.save();
                const libinsert = new Lib({
                    book: inbook,
                    count: incrementValue
                })
                libinsert.save();
                console.log("Inserted");
                returnObject.Status = true;
            }
            else {
                const incrementValue = req.body.count;
                Lib.findOneAndUpdate({ 'book.book_ISBN': bISBN }, { $inc: { 'count': incrementValue } }, { new: true }, (err, updated) => {
                    if (err) {
                        res.send({
                            Status: false,
                            StatusMessage: err
                        });
                    } else {
                        console.log(updated);
                    }
                });
            }
        }
        else {
            returnObject.Status = false;
            returnObject.StatusMessage = err;
        }

        res.send(returnObject);
    });

});
//================================================= Remove a book from library ==============================
app.post("/removeBook", function (req, res) {
    var returnObject = {
        Status: true,
        StatusMessage: ""
    };
    const bISBN = _.toUpper(req.body.book_ISBN);
    const incrementValue = req.body.count;
    Lib.findOne({ 'book.book_ISBN': bISBN }, function (err, found) {
        if (!err) {
            if (found) {
                if (found.count <= incrementValue) {
                    Lib.findOneAndDelete({ 'book.book_ISBN': bISBN }, (err, found) => {
                        if (err) {
                            res.send({
                                Status: false,
                                StatusMessage: err
                            });
                        }
                    });
                    Book.findOneAndDelete({ 'book_ISBN': bISBN });
                }
                else {
                    Lib.findOneAndUpdate({ 'book.book_ISBN': bISBN }, { $inc: { count: -1 * incrementValue } }, { new: true }, (err, updated) => {
                        console.log(updated);
                    });
                }
            } else {
                res.send({
                    Status: false,
                    StatusMessage: "Book not found"
                });
            }
            res.send(returnObject);
        }
        else {
            res.send({
                Status: false,
                StatusMessage: err
            });
        }
    });
    res.send(returnObject);
});


//============================================== Issue a book ==========================================
app.post("/issue", function (req, res) {
    console.log("Issuing")
    var returnObject = {
        Status: true,
        StatusMessage: "Issued the book"
    };
    const SRollNo = req.body.student_rollno;
    const IssuedBook = req.body.book_ISBN;
    Lib.findOneAndUpdate({ 'book.book_ISBN': IssuedBook }, { $inc: { 'count': -1 } }, { new: true }, function (err, updated) {

        if (err) {
            console.log(err);
            res.send({
                Status: false,
                StatusMessage: err
            });
        }
        else {
            returnObject.Status = true;
            console.log(updated);
            const NewIssue = new Issue({
                issued_rollno: SRollNo,
                issued_ISBN: IssuedBook
            });
            NewIssue.save();
        }
    });
    res.send(returnObject);

});


//========================================== Returning a book ==========================================
app.post("/return", function (req, res) {
    console.log("REturning a book")
    var returnObject = {
        Status: true,
        StatusMessage: "",
    };
    var returned_ISBN = req.body.book_ISBN;

    Lib.findOneAndUpdate({ 'book.book_ISBN': returned_ISBN }, { $inc: { 'count': -1 } }, { new: true }, function (err, updated) {
        if (err) {
            console.log(err);
            returnObject.StatusMessage = err;
            res.send({
                Status: false,
                StatusMessage: "Couldn't find and update",
            });
        }
        else {
            console.log(updated);
        }
    });
    Issue.findOneAndDelete({ 'issued_ISBN': returned_ISBN }, function (err) {
        if (err) {
            returnObject.StatusMessage = err;
            res.send({
                Status: false,
                StatusMessage: "Couldn't find and delete",
            });
        }
        else {
            console.log("Deleted the entry");
        }
    });
    res.send(returnObject);
});

//==================================== Adding a document for printing ==========================

app.post("/printQuery", function (req, res) {
    console.log("Entered");
    console.log(req.body);
    var returnObject = {
        Status: true,
        StatusMessage: "Successfully Added the document to the queue",
    };
    if (!req.files) {
        returnObject.Status = false;
        returnObject.StatusMessage = "No file uploaded";
    }
    else {
        const uploadedFile = req.files.file;
        const fileName = uploadedFile.name;

        uploadedFile.mv('./uploads/' + fileName);
    }
    res.send(returnObject);
});



// res.send(returnObject)

// const SRollNo = "190010034";
// const IssuedBook = "2222";
// Lib.find({ 'book.book_ISBN': IssuedBook }, function (err, found) {
//     console.log(found);

// })
















// let port = process.env.PORT;
// if (port == null || port === "") {
//     port = 5000;
// }

app.listen(5000, function () {
    console.log("Server started sucessfully");
});
