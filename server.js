'use strict';

// Application Dependencies

require('dotenv').config();
const express = require('express');
const superagent = require('superagent');
const methodOverride = require('method-override');

// Application Setups

const PORT = process.env.PORT || 3000;
const server = express();
server.set('view engine','ejs');
server.use(express.urlencoded({ extended: true }));
server.use(express.static('./public'))
server.use(methodOverride('_method'));

//testing

server.get('/hello',(req,res)=>{
    res.render('pages/index');
})

//home

server.get('/', homehandler);
  
//searches

server.get('/searches/new',(req,res)=>{
    res.render('pages/searches/new');
});


//DataBase

const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
 
//serverrrsss  search results,add,details,update,delete
server.post('/searches', resultHandler);
server.post('/books', bookAddHandler);
server.get('/bookDetails/:id',getbookDetails);
server.put('/updateBook/:id',updatebookHandler);
server.delete('/deleteBook/:id',deletebookHandler);


// search results
function resultHandler(req,res){
    let Book = req.body.search;
    let term= req.body.searchBy;
    // console.log(Book ,term);
    let URL =`https://www.googleapis.com/books/v1/volumes?q=search+${term}:${Book}`;
    superagent .get(URL)
    .then(booksData => {
        let booksArr = booksData.body.items.map(item => new Books(item));
        res.render('pages/searches/show', { bookArray: booksArr });
    })
    .catch (error=>{
        console.log(error);
        res.send(error);
    });
}
//adding Book
function bookAddHandler (req,res){
    // console.log(req.body);
    let SQL = `INSERT INTO books (author, title, isbn, img, description) VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    let safevalues = [req.body.author, req.body.title, req.body.isbn , req.body.img ,req.body.description];
    client.query(SQL, safevalues)
    .then(result => {
            res.redirect(`/bookDetails/${result.rows[0].id}`);
        })
        .catch (error=>{
            console.log(error);
            res.send(error);
          });
}
// bookDetailes
function getbookDetails(req, res) {
    let SQL = `SELECT * FROM books WHERE id=$1;`;
    let value = [req.params.id];
    // console.log(req.params)
   client.query(SQL, value)
        .then(result => {
            // console.log(result)
            res.render('pages/books/show', { book: result.rows[0] });
        })
        .catch (error=>{
            console.log(error);
            res.send(error);
          });
}
 

//homehandler
function homehandler(req,res){
let SQL=`SELECT * FROM books `;
client.query(SQL)
        .then(result => {
            // console.log(result)
            res.render('pages/index', { book: result.rows });
        })
        .catch (error=>{
            console.log(error);
            res.send(error);
          });
}

//updat&delet 


//updateBook/5?_method=put
function updatebookHandler(req,res){
    let {author, title, isbn, img, description} = req.body;
    let SQL = `UPDATE books SET author=$1,title=$2,isbn=$3,img=$4,description=$5 WHERE id=$6;`;
    let safeValues = [author,title,isbn,img,description,req.params.id];
    client.query(SQL,safeValues)
    .then(()=>{
      res.redirect(`/bookDetails/${req.params.id}`);
    })
    .catch (error=>{
        console.log(error);
        res.send(error);
      });
}
//deletBook/5?_method=put

function deletebookHandler(req,res) {
    let SQL = `DELETE FROM books WHERE id=$1;`;
    let value = [req.params.id];
    client.query(SQL,value)
    .then(res.redirect('/'))
    .catch (error=>{
        console.log(error);
        res.send(error);
      });
  }

//construct function 

function Books(Data){
this.title = Data.volumeInfo.title || `Book title not found `;
this.author = Data.volumeInfo.authors || `Author name not available`;
this.description = (Data.volumeInfo.description) ? Data.volumeInfo.description : `description unavilable`;
this.img = (Data.volumeInfo.imageLinks) ? Data.volumeInfo.imageLinks.thumbnail : `https://i.imgur.com/J5LVHEL.jpg`;
if(Data.volumeInfo.industryIdentifiers){
    this.isbn = Data.volumeInfo.industryIdentifiers[0].identifier;}else{
    this.isbn = 'NOT available';}
}
//error
server.get('*',(req,res)=>{
    res.render('pages/error');
});

//listening and connect 
client.connect()
  .then(() => {
   server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
  })
