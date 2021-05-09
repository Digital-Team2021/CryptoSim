'use strict';
//app depandancies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');
const methodOverride = require('method-override');

//app setup
const server = express();
server.use(cors());
server.use(express.static('public'));
server.set('view engine', 'ejs');
const PORT = process.env.PORT || 4500;
const client = new pg.Client(process.env.DATABASE_URL);
server.use(express.urlencoded({ extended: true }));
server.use(methodOverride('_method'));

//root
server.get('/', homeHandler);
server.get('/market', marketHandler);
server.get('/register', registerHandler);
server.post('/registerFinish', registerFinishHandler);
server.get('/login', loginHandler);
server.post('/loginFinish', loginFinishHandler);
server.get('/logout', logoutHandler);
server.get('/trade/:coin', tradeHandler);
server.put('/buy', buyHandler);
server.get('/wallet', walletHandler);
server.get('/about', aboutHandler);
server.get('*', errorHandler);

// callback function
function homeHandler(req, res) {
  let key = process.env.NEWSKEY;
  let url1 = `https://cryptopanic.com/api/v1/posts/?auth_token=${key}`;
  superagent.get(url1)
    .then(data => {
      let dataNews = data.body.results;

      let newsArray = dataNews.map(item => {

        return new News(item);
      });
      let url2 = `https://api.coingecko.com/api/v3/coins?per_page=5&page=1`;
      superagent.get(url2)
        .then(data2 => {
          let dataTrend = data2.body;
          let trendArray = dataTrend.map(item => {

            return new Coins(item);
          });

          res.render('pages/index', { news: newsArray, trend: trendArray });
        }).catch(error => {
          console.log(error);
          res.render('pages/error');
        });

    });

}

function marketHandler(req, res) {

  let url = `https://api.coingecko.com/api/v3/coins?per_page=15&page=1`;
  superagent.get(url)
    .then(data2 => {
      let dataCoins = data2.body;
      let coinsArray = dataCoins.map(item => {

        return new Coins(item);
      });

      res.render('pages/market', { coins: coinsArray });
    }).catch(error => {
      console.log(error);
      res.render('pages/error');
    });

}

function registerHandler(req, res) {

  res.render('pages/register');
}
function loginHandler(req, res) {

  res.render('pages/login');

}


function registerFinishHandler(req, res) {
  let data = Object.values(req.body);
  if (data[2] !== data[3]) {
    console.log('Passwords did not match');
    res.redirect('/register');
  }
  else {
    let query = `INSERT INTO personal_info (name,email,password) VALUES ($1,$2,$3);`;
    let safeValue = [data[0], data[1], data[2]];
    client.query(query, safeValue)
      .then(() => {
        let query2 = `INSERT INTO coins_info (name,coinName,amount) VALUES ($1,$2,$3);`;
        let safeValue2 = [data[0], 'usd', data[4]];
        client.query(query2, safeValue2)
          .then(() => {

            res.redirect('/login');

          });
      })
      .catch(error => {
        console.log(error);
        res.render('pages/error');
      });
  }
}

function loginFinishHandler(req, res) {
  let email = [req.body.email];
  let query = `SELECT * FROM personal_info WHERE email = $1 ;`;
  let password = req.body.password;
  client.query(query, email)
    .then(result => {
      if (!result.rows[0]) {
        console.log('Invalid Email');
        res.redirect('/login');
      } else if (result.rows[0].password === password) {

        res.render('pages/welcome', { userData: result.rows[0] });
      } else {
        console.log('Invalid Password');
        res.redirect('/login');
      }
    })
    .catch(error => {
      console.log(error);
      res.render('pages/error');
    });
}

function aboutHandler(req, res) {
  res.render('pages/about');
}

function tradeHandler(req, res) {
  let coinName = req.params.coin;
  let url = `https://api.coingecko.com/api/v3/coins/${coinName}?localization=false`;

  superagent.get(url)
    .then(data => {

      let coinData = data.body;
      let coinInfo = {
        id: coinData.id,
        symbol: coinData.symbol,
        img: coinData.image.large,
        rank: `#${coinData.market_cap_rank}`,
        price: coinData.market_data.current_price.usd,
        market_cap: `${coinData.market_data.market_cap.usd} $`,
        high_24h: `${coinData.market_data.high_24h.usd} $`,
        low_24h: `${coinData.market_data.low_24h.usd} $`,
        change: `${coinData.market_data.price_change_percentage_24h} %`

      };

      res.render('pages/trade', { coin: coinInfo });

    });

}

function buyHandler(req, res) {

  let buyData = req.body;

  let SQL8 = `SELECT * FROM coins_info WHERE coinName = $1 AND name= $2;`;
  let safeValue8 = ['usd', buyData.name];
  client.query(SQL8, safeValue8)
    .then((data4) => {
      if (Number(req.body.amount) < Number(data4.rows[0].amount)) {
        let SQL = `SELECT * FROM coins_info WHERE coinName = $1 AND name= $2;`;
        let safeValue = [buyData.coinName, buyData.name];
        client.query(SQL, safeValue)
          .then(data => {

            if (data.rows.length === 0) {



              let SQL3 = `INSERT INTO coins_info (name,coinName,amount) VALUES ($1,$2,$3);`;
              let insertAmount = Number(buyData.amount) / Number(buyData.price);

              let safeValue3 = [buyData.name, buyData.coinName, insertAmount.toFixed(7)];
              client.query(SQL3, safeValue3)
                .then(() => {
                  let SQL6 = `SELECT * FROM coins_info WHERE coinName = $1 AND name= $2;`;
                  let safeValue6 = ['usd', buyData.name];
                  client.query(SQL6, safeValue6)
                    .then(data3 => {
                      let SQL7 = 'UPDATE coins_info SET amount=$1 WHERE coinName = $2 AND name= $3;';
                      let uppdatedUSD3 = Number(data3.rows[0].amount) - Number(buyData.amount);
                      let safeValue7 = [uppdatedUSD3.toFixed(7), 'usd', buyData.name];
                      client.query(SQL7, safeValue7)
                        .then(() => {
                          res.redirect('/wallet');
                        });

                    });

                });


            } else {
              let SQL2 = 'UPDATE coins_info SET amount=$1 WHERE coinName = $2 AND name= $3;';
              let updatedAmount = Number(data.rows[0].amount) + Number(buyData.amount) / Number(buyData.price);
              let safeValue2 = [updatedAmount.toFixed(7), buyData.coinName, buyData.name];
              client.query(SQL2, safeValue2)
                .then(() => {
                  let SQL4 = `SELECT * FROM coins_info WHERE coinName = $1 AND name= $2;`;
                  let safeValue4 = ['usd', buyData.name];
                  client.query(SQL4, safeValue4)
                    .then(data2 => {
                      let SQL5 = 'UPDATE coins_info SET amount=$1 WHERE coinName = $2 AND name= $3;';
                      let uppdatedUSD1 = Number(data2.rows[0].amount) - Number(buyData.amount);
                      let safeValue5 = [uppdatedUSD1.toFixed(7), 'usd', buyData.name];
                      client.query(SQL5, safeValue5)
                        .then(() => {
                          res.redirect('/wallet');
                        });
                    });
                });

            }

          });
      }else{
        console.log('succes');
      }
    });

}

function walletHandler(req, res) {
  res.render('pages/wallet');
}

function logoutHandler(req, res) {

  res.render('pages/logout');

}


function errorHandler(req, res) {
  res.status(500).render('pages/error');
}


// constructors

function News(obj) {
  this.title = obj.title;
  this.url = `https://${obj.source.domain}/${obj.slug}`;
}

function Coins(obj) {
  this.rank = `#${obj.market_data.market_cap_rank}`;
  this.id = obj.id;
  this.symbol = obj.symbol;
  this.img = obj.image.thumb;
  this.price = `${obj.market_data.current_price.usd} $`;
  this.change = `${obj.market_data.price_change_percentage_24h} %`;
  let x = obj.image.thumb.split('/');
  this.chart = `https://www.coingecko.com/coins/${x[5]}/sparkline`;

}


client.connect()
  .then(() => {

    server.listen(PORT, () => {
      console.log(`my port is ${PORT}`);

    });

  });
