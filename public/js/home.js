'use strict';

$('.news').hide();

$('#newButton').on('click' , function () {
  $('.news').toggle();
});
