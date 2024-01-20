const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const {response, request} = require("express");
const app = express();
const port = 3000;
app.use(express.json());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'users_html')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
const userFilePath = 'user.json';
const lastUserFile = 'lastUser.json';


const readUsers = () => {
    try {
        const data = fs.readFileSync(userFilePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};
const readLastUsers = () => {
    try {
        const data = fs.readFileSync(lastUserFile, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        return [];
    }
};
const writeUsers = (users) => {
    fs.writeFileSync(userFilePath, JSON.stringify(users, null, 2), 'utf8');
};
const writeLastUsers = (lastUsers) => {
    fs.writeFileSync(lastUserFile, JSON.stringify(lastUsers, null, 2), 'utf8');
};

app.post('/submit', (req, res) => {
    const { number, name } = req.body;
    const users = readUsers();
    console.log("read:",users)

    // 检查用户是否已存在
    const existingUser = users.find(user => user.number === number);
    if (existingUser) {
        //alert('您已在抽奖名单中')
        return res.status(400).json({ error: '用户已存在' });
    }

    // 添加新用户
    users.push({ number, name, won: false, level: 0, round: 1});
    writeUsers(users);
    console.log("add:", users)

    res.json({ success: true });
});
app.post('/startDraw', (req, res) => {
    const users = readUsers();

    // 在这里根据你的逻辑为用户分配中奖等级，假设你有三个等级
    for (const user of users) {
        user.level = Math.floor(Math.random() * 3) + 1;
    }

    // 更新用户信息
    writeUsers(users);
    console.log("question:", users)

    res.json({ success: true });
});

// 抽奖路由处理
app.get('/draw', (req, res) => {
        const numWinners = parseInt(req.query.numWinners) || 5;
        const rewardLevel = req.query.rewardLevel || '一等奖';

        const users = readUsers().filter(user => !user.won); // 只抽取未中奖的用户

        if (numWinners > users.length) {
            return res.status(400).json({ error: '抽奖人数超过剩余用户数' });
        }

        // 随机抽取中奖用户
        const winners = [];
        for (let i = 0; i < numWinners; i++) {
            const randomIndex = Math.floor(Math.random() * users.length);
            const winner = users.splice(randomIndex, 1)[0];
            winner.level = getLevelByReward(rewardLevel);
            winner.won = true;
            winners.push(winner);

            // 为中奖用户创建结果页面，放在 public 目录下
            const resultFilePath = path.join(__dirname, 'users_html', `${winner.number}_result.html`);
            //const user = readUsers().find(user => user.number === num);
            fs.writeFileSync(resultFilePath, `
<html lang="cn_ZH">
<head><title>抽奖结果</title>
<style>
    /* 设置整个页面的背景颜色为浅蓝色 */
    body {
        background-color: white;
    }
    /* 设置标题的字体为黑色，加粗，有一个白色的阴影 */
    h1 {      
      font-size: 50px ;
      color: black;
      font-weight: bold;       
      text-shadow: 2px 2px 5px white;    
  }   
  p {        
      color: black;       
      text-shadow: 2px 2px 5px white;    
  }  
  div {        
      width: 50%;   
      margin-top: 10%;
      margin-left: 25%;      
      background-color: white;        
      box-shadow: 0 0 10px rgba(0,0,0,0.5);        
      border-radius: 10px;        
      padding: 10px;    
  }
</style>
</head>
   <body>
      <div style="text-align: center;">
         <h1>恭喜您中奖</h1>
         <p>中奖等级：${rewardLevel}</p>
       </div>
        <button id="viewWinnersButton">查看中奖名单</button>

            <!-- JavaScript 代码 -->
        <script>
                // 按钮点击事件
                document.getElementById('viewWinnersButton').onclick = function() {
                    // 跳转到显示所有中奖名单的页面
                    window.location.href = '/winners';
                };
         </script>
</body>
</html>`);
        }

        // 为未中奖用户创建结果页面，放在 public 目录下
        for (const user of users) {
            const resultFilePath = path.join(__dirname, 'public', `${user.number}_result.html`);
            fs.writeFileSync(resultFilePath, `
<html lang="cn_ZH"><head><title>抽奖结果</title>
<style>
    /* 设置整个页面的背景颜色为浅蓝色 */
    body {
        background-color: #e0f0ff;
    }

    /* 设置标题的字体为黑色，加粗，有一个白色的阴影 */
   h1 {      
      font-size: 50px ;
      color: black;
      font-weight: bold;       
      text-shadow: 2px 2px 5px white;    
  }   
  p {        
      color: black;       
      text-shadow: 2px 2px 5px white;    
  }  
  div {        
      width: 50%;   
      margin-top: 10%;
      margin-left: 25%;      
      background-color: white;        
      box-shadow: 0 0 10px rgba(0,0,0,0.5);        
      border-radius: 10px;        
      padding: 10px;    
  }
</style></head><body><div style="text-align: center;"><h1>新年快乐，万事如意</h1></div>
<button id="viewWinnersButton">查看中奖名单</button>

            <!-- JavaScript 代码 -->
        <script>
                // 按钮点击事件
                document.getElementById('viewWinnersButton').onclick = function() {
                    // 跳转到显示所有中奖名单的页面
                    window.location.href = '/winners';
                };
         </script>
         </body></html>`);
        }

    const updatedNonWinners = users.map(user => ({
        ...user,
        round: user.round + 1,
    }));
    console.log('no win  users:', updatedNonWinners);
    const lastUser = readLastUsers()
    console.log('last users:', readLastUsers());
    writeLastUsers([...winners, ...lastUser])

    writeUsers([...updatedNonWinners, ...winners, ...lastUser]);

    console.log('Updated users:', readUsers());
        res.json({ won: true, winners });
    });

app.get('/results/:number', (req, res) => {
    const number = req.params.number
    const resultFilePath1 = path.join(__dirname, 'users_html', `${number}_result.html`);
    //console.log('Requested result for user number:', number);
    //console.log('Result file path:', resultFilePath1);


    if (fs.existsSync(resultFilePath1)) {
        res.sendFile(resultFilePath1);
    } else {
        res.status(404).send(`
            <html lang="cn_ZH"> 
            <head><title>抽奖结果</title><style>
 body {        
            background-color: white;   }
  h1 {      
      font-size: 50px ;
      color: black;
      font-weight: bold;       
      text-shadow: 2px 2px 5px white;    
  }   
  p {        
      color: black;       
      text-shadow: 2px 2px 5px white;    
  }  
  div {        
      width: 50%;   
      margin-top: 10%;
      margin-left: 25%;      
      background-color: white;        
      box-shadow: 0 0 10px rgba(0,0,0,0.5);        
      border-radius: 10px;        
      padding: 10px;    
  }
   </style>
   </head>
   <body>
            <div style="text-align: center;"><h1>抽奖还没开始，稍作等待</p></div>
            <button id="viewWinnersButton">查看中奖名单</button>

        <script>
                // 按钮点击事件
                document.getElementById('viewWinnersButton').onclick = function() {
                    // 跳转到显示所有中奖名单的页面
                    window.location.href = '/winners';
                };
         </script>
   </body>
   </html>`);
    }
});

app.get('/winners', (req, res) => {
    const users = readUsers();
    // 筛选出中奖者的信息
    const winnersData = users.filter(user => user.won)
        .map(user => ({ name: user.name, rewardLevel: getRewardLevel(user.level), round: user.round }));
    // 生成 HTML 页面
    const htmlContent = generateWinnersHTML(winnersData);
    // 发送 HTML 页面给前端
    res.send(htmlContent);
});

app.get('/checkUser', (req, res) => {
    const userNumber = req.query.number;
    // 读取用户信息
    const users = readUsers();
    // 检查用户是否存在
    const userExists = users.some(user => user.number === userNumber);
    // 返回 JSON 数据，指示用户是否存在
    res.json({ exists: userExists });
});

// 辅助函数：生成中奖者信息的 HTML 页面
function generateWinnersHTML(winnersData) {
    let htmlContent = '<html lang=""><head><title>中奖者名单</title></head><body>';
    // 根据中奖者信息按照轮次生成 HTML 内容
    winnersData.forEach(winner => {
        htmlContent += `<p>第 ${winner.round} 轮抽奖 - 奖励等级：${winner.rewardLevel} - 姓名：${winner.name}</p>`;
    });
    htmlContent += '</body></html>';
    return htmlContent;
}
app.get('/set', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

function getRewardLevel(level) {
    // 这里可以根据实际情况设置中奖等级对应的奖励等级
    // 这里简单示范，假设 1 对应一等奖，2 对应二等奖，3 对应三等奖
    switch (level) {
        case 1:
            return '一等奖';
        case 2:
            return '二等奖';
        case 3:
            return '三等奖';
        // 添加更多中奖等级的对应关系...
        default:
            return '未知奖项';
    }
}

function getLevelByReward(rewardLevel) {
    // 这里可以根据实际情况设置奖励等级对应的抽奖等级
    // 这里简单示范，假设 '一等奖' 对应 1， '二等奖' 对应 2， '三等奖' 对应 3
    switch (rewardLevel) {
        case '一等奖':
            return 1;
        case '二等奖':
            return 2;
        case '三等奖':
            return 3;
        // 添加更多奖励等级的对应关系...
        default:
            return 0; // 默认为0
    }
}
app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
