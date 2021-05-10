'use strict';


let coinName = $('#coinName').val();

setTimeout(() => {

  window.location.href = `/trade/${coinName}`;

}, 5000);
