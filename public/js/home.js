'use strict';

$('.news').hide();
$('#LessButton').hide();

$('#newButton').on('click' , function () {
  $('.news').toggle();
  $('#newButton').hide();
  $('#LessButton').show();
});

$('#LessButton').on('click' , function () {
  $('.news').toggle();
  $('#newButton').show();
  $('#LessButton').hide();
});

