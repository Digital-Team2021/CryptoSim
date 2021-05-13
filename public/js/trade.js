'use strict';

let userName2 = localStorage.getItem('userName');
let login2 = localStorage.getItem('login');
$('.userNameBuy').val(userName2);

$('.buy').hide();
$('.sell').hide();

$('.buyBtn').on('click',()=>{

  $('.buy').toggle();
  $('.sell').hide();

});

$('.sellBtn').on('click',()=>{

  $('.sell').toggle();
  $('.buy').hide();

});

if(parseInt(login2)===0){

  $('.tradeExchangeAndForms').hide();

}
