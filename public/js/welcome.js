'use strict';


let userName = $('#userName').attr('value');

localStorage.setItem('userName', userName);
localStorage.setItem('login', 1);

let login = localStorage.getItem('login');

if(parseInt(login)===1){

  $('.rlwHideandShow').hide();
  $('.username').text(userName);

}else{
  $('.wallet').hide();
  $('.username').hide();
  $('.logout').hide();
}

setTimeout(() => {

  window.location.href = '/';

}, 5000);

