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
server.get('/market/:page', marketHandler);
server.get('/register', registerHandler);
server.post('/registerFinish', registerFinishHandler);
server.get('/login', loginHandler);
server.post('/loginFinish', loginFinishHandler);
server.get('/logout', logoutHandler);
server.get('/trade/:coin', tradeHandler);
server.put('/buy', buyHandler);
server.put('/sell', sellHandler);
server.get('/wallet/:name', walletHandler);
server.get('/about', aboutHandler);
server.get('/profile/:name', profileHandler);
server.put('/updateUser/:name', updateUserHandler);
server.delete('/deleteUser/:name', deleteUserHandler);
server.post('/search', searchHandler);
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
          console.log(error.message);
          res.render('pages/error');
        });

    });

}

function marketHandler(req, res) {

  let thisPage = req.params.page
  let nextPage = Number(thisPage) + 1
  let previousPage = Number(thisPage) - 1


  let url = `https://api.coingecko.com/api/v3/coins?per_page=15&page=${thisPage}`;
  superagent.get(url)
    .then(data2 => {
      let dataCoins = data2.body;
      let coinsArray = dataCoins.map(item => {

        return new Coins(item);
      });

      let pages = {

        next: nextPage,
        previous: previousPage
      }

      res.render('pages/market', { coins: coinsArray, page: pages });
    }).catch(error => {
      console.log(error.message);
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
  let username = data[0].trim()

  let SQL = `SELECT * FROM personal_info WHERE name= $1 OR email= $2;`;
  let safeValue2 = [username, data[1]];

  client.query(SQL, safeValue2)
    .then(data2 => {
      if (data2.rows.length !== 0) {
        let obj = { message: 'Name or Email is used' };
        res.render('pages/registerHandler', { msg: obj });
      } else {

        if (data[2] !== data[3]) {

          let obj = { message: 'Passwords did not match' };
          res.render('pages/registerHandler', { msg: obj });
        }
        else {
          let query = `INSERT INTO personal_info (name,email,password) VALUES ($1,$2,$3);`;
          let safeValue = [username, data[1], data[2]];
          client.query(query, safeValue)
            .then(() => {
              let query2 = `INSERT INTO coins_info (name,coinName,amount) VALUES ($1,$2,$3);`;
              let safeValue2 = [username, 'usd', data[4]];
              client.query(query2, safeValue2)
                .then(() => {

                  res.redirect('/login');

                });
            })
            .catch(error => {
              console.log(error.message);
              res.render('pages/error');
            });
        }
      }
    });
}

function loginFinishHandler(req, res) {
  let email = [req.body.email];
  let query = `SELECT * FROM personal_info WHERE email = $1 ;`;
  let password = req.body.password;
  client.query(query, email)
    .then(result => {
      if (!result.rows[0]) {
        let obj = { message: 'Invalid Email' };
        res.render('pages/loginHandler', { msg: obj });
      } else if (result.rows[0].password === password) {

        res.render('pages/welcome', { userData: result.rows[0] });
      } else {
        let obj = { message: 'Invalid Password' };
        res.render('pages/loginHandler', { msg: obj });
      }
    })
    .catch(error => {
      console.log(error.message);
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

    }).catch(error => {
      console.log(error.message);
      res.render('pages/error');
    });

}

function buyHandler(req, res) {

  let buyData = req.body;

  let SQL8 = `SELECT * FROM coins_info WHERE coinName = $1 AND name= $2;`;
  let safeValue8 = ['usd', buyData.name];
  client.query(SQL8, safeValue8)
    .then((data4) => {
      if (Number(req.body.amount) <= Number(data4.rows[0].amount)) {
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
                          let obj = {
                            message: `${insertAmount.toFixed(7)} of ${buyData.coinName} Was purchased`,
                            coinName: buyData.coinName
                          };
                          res.render('pages/finishTrade', { msg: obj });
                        }).catch(error => {
                          console.log(error.message);
                          res.render('pages/error');
                        });

                    }).catch(error => {
                      console.log(error.message);
                      res.render('pages/error');
                    });

                }).catch(error => {
                  console.log(error.message);
                  res.render('pages/error');
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
                          let obj = {
                            message: `${(Number(buyData.amount) / Number(buyData.price)).toFixed(7)} of ${buyData.coinName} Was purchased`,
                            coinName: buyData.coinName
                          };
                          res.render('pages/finishTrade', { msg: obj });
                        }).catch(error => {
                          console.log(error.message);
                          res.render('pages/error');
                        });
                    }).catch(error => {
                      console.log(error.message);
                      res.render('pages/error');
                    });
                }).catch(error => {
                  console.log(error.message);
                  res.render('pages/error');
                });

            }

          });
      } else {
        let obj = {
          message: `There is no enough amount balance`,
          coinName: buyData.coinName
        };
        res.render('pages/finishTrade', { msg: obj });
      }
    }).catch(error => {
      console.log(error.message);
      res.render('pages/error');
    });

}

function sellHandler(req, res) {
  let sellData = req.body;
  let SQL1 = `SELECT * FROM coins_info WHERE coinName = $1 AND name= $2;`;
  let safeValue1 = [sellData.coinName, sellData.name];
  client.query(SQL1, safeValue1)
    .then(data => {
      if (data.rows.length === 0) {
        let obj = {
          message: `You don't have ${sellData.coinName}`,
          coinName: sellData.coinName
        };
        res.render('pages/finishTrade', { msg: obj });
      } else {
        if (Number(sellData.amount) > Number(data.rows[0].amount)) {
          let obj = {
            message: `There is no enough amount balance of ${sellData.coinName}`,
            coinName: sellData.coinName
          };
          res.render('pages/finishTrade', { msg: obj });
        } else {
          let SQL2 = 'UPDATE coins_info SET amount=$1 WHERE coinName = $2 AND name= $3;';
          let updatedAmount = Number(data.rows[0].amount) - Number(sellData.amount);
          let safeValue2 = [updatedAmount.toFixed(7), sellData.coinName, sellData.name];
          client.query(SQL2, safeValue2)
            .then(() => {
              let SQL3 = `SELECT * FROM coins_info WHERE coinName = $1 AND name= $2;`;
              let safeValue3 = ['usd', sellData.name];
              client.query(SQL3, safeValue3)
                .then(data2 => {

                  let SQL4 = 'UPDATE coins_info SET amount=$1 WHERE coinName = $2 AND name= $3;';
                  let uppdatedUSD = Number(data2.rows[0].amount) + Number(sellData.amount) * Number(sellData.price);
                  let safeValue4 = [uppdatedUSD.toFixed(7), 'usd', sellData.name];
                  client.query(SQL4, safeValue4)
                    .then(() => {
                      let obj = {
                        message: `You sold ${sellData.amount} of ${sellData.coinName} Successfully`,
                        coinName: sellData.coinName
                      };
                      res.render('pages/finishTrade', { msg: obj });
                    }).catch(error => {
                      console.log(error.message);
                      res.render('pages/error');
                    });

                }).catch(error => {
                  console.log(error.message);
                  res.render('pages/error');
                });

            }).catch(error => {
              console.log(error.message);
              res.render('pages/error');
            });
        }
      }

    }).catch(error => {
      console.log(error.message);
      res.render('pages/error');
    });

}

function profileHandler(req, res) {
  let name = req.params.name;
  let SQL = `SELECT * FROM personal_info WHERE name = $1;`;
  let safeValue = [name];
  client.query(SQL, safeValue)
    .then(data => {
      let userData = data.rows[0];
      let SQL2 = `SELECT * FROM coins_info WHERE name = $1 AND coinName = $2;`;
      let safeValue2 = [name, 'usd'];
      client.query(SQL2, safeValue2)
        .then(data2 => {

          let usdAmount = data2.rows[0].amount;
          let obj = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            password: userData.password,
            amount: usdAmount
          };

          res.render('pages/profile', { user: obj });
        }).catch(error => {
          console.log(error.message);
          res.render('pages/error');
        });

    }).catch(error => {
      console.log(error.message);
      res.render('pages/error');
    });
}

function updateUserHandler(req, res) {
  let name = req.params.name;
  let email = req.body.email;
  let amount = req.body.amount;
  let password = req.body.password;
  let SQL = 'UPDATE personal_info SET email=$1, password= $2 WHERE name = $3;';
  let safeValue = [email, password, name];
  client.query(SQL, safeValue)
    .then(() => {
      let SQL2 = 'UPDATE coins_info SET amount=$1 WHERE name = $2 AND coinName= $3;';
      let safeValue2 = [amount, name, 'usd'];
      client.query(SQL2, safeValue2)
        .then(() => {
          res.redirect(`/profile/${name}`);
        }).catch(error => {
          console.log(error.message);
          res.render('pages/error');
        });

    }).catch(error => {
      console.log(error.message);
      res.render('pages/error');
    });
}

function deleteUserHandler(req, res) {
  let name = req.params.name;
  let SQL = `DELETE FROM personal_info WHERE name=$1;`;
  let safeValue = [name];
  client.query(SQL, safeValue)
    .then(() => {
      let SQL2 = `DELETE FROM coins_info WHERE name=$1;`;
      let safeValue2 = [name];
      client.query(SQL2, safeValue2)
        .then(() => {
          res.redirect(`/logout`);
        }).catch(error => {
          console.log(error.message);
          res.render('pages/error');
        });
    }).catch(error => {
      console.log(error.message);
      res.render('pages/error');
    });
}

function walletHandler(req, res) {

  let name = req.params.name;
  let SQL = `SELECT * FROM coins_info WHERE name = $1;`;
  let safeValue = [name];
  client.query(SQL, safeValue)
    .then(async (data) => {
      let listData = data.rows;

      const coinOpjArr = await Promise.all(listData.map(async (item, i) => {
        if (item.coinname === 'usd') return {
          id: 'usd',
          price: 1,
          img: 'https://www3.0zz0.com/2021/05/10/16/271619180.png'
        };
        let url = `https://api.coingecko.com/api/v3/coins/${item.coinname}?localization=false`;
        const data = await superagent.get(url)


        let obj = {
          id: data.body.id,
          price: data.body.market_data.current_price.usd,
          img: data.body.image.thumb
        };
        return obj;

      }))

      let totalBalance = 0;
      let walletData = listData.map((item, i) => {

        return new Wallet(item, coinOpjArr[i])
      })

      walletData.forEach((item) => {
        totalBalance = totalBalance + Number(item.value);
      })

      let objBalance = {
        balance: totalBalance.toFixed(7)
      }

      res.render('pages/wallet', { walletinfo: walletData, total: objBalance });

    }).catch(error => {
      console.log(error.message);
      res.render('pages/error');
    });

}

function logoutHandler(req, res) {

  res.render('pages/logout');

}

function searchHandler(req, res) {

  let search = req.body.searche;
  let searchArray = []
  let url = `https://api.coingecko.com/api/v3/coins/list`

  superagent.get(url)
    .then(data => {

      let coins = data.body;
      coins.forEach((item) => {
        if (item.id.includes(search)) {
          searchArray.push(item.id);
        }
      });

      res.send(searchArray)

    });

}


function errorHandler(req, res) {
  res.status(500).render('pages/error');
}


// constructors

function News(obj) {
  this.title = obj.title;
  this.url = `https://${obj.source.domain}/${obj.slug}`;
}

function Wallet(objlist, objcoin) {
  this.coinName = objlist.coinname;
  this.img = objcoin.img;
  this.amount = objlist.amount;
  this.value = (Number(objlist.amount) * Number(objcoin.price)).toFixed(7)

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
