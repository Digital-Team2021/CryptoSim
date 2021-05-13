'use strict';



$('.search_form').hide();
$('.searchbtn').on('click',()=>{

  $('.search_form').toggle();

});
let page = $('.previousPage1').val();

if(Number(page)===0){
  $('.previousPage2').hide();
}



