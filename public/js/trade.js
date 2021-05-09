'use strict';

let userName2 = localStorage.getItem('userName');

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
