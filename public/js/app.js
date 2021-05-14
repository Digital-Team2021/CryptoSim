'use strict';

let login = localStorage.getItem('login');
let userName = localStorage.getItem('userName');

$('.username').attr('href',`/profile/${userName}`);
$('.wallet').attr('href',`/wallet/${userName}`);


if(parseInt(login)===1){

  $('.rlwHideandShow').hide();
  $('.username').text(`${userName}`);

}else{
  $('.wallet').hide();
  $('.username').hide();
  $('.logout').hide();
}
