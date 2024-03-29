# lottery-everyone

这是一个基于nodejs构建的抽奖程序，每个参与活动的人可以通过扫码填写信息加入抽奖名单，并在自己的终端上查看中奖结果，适用于年会或家庭聚会等各种场合的抽奖。

## 本地构建

克隆项目到本地

```sh
git clone https://github.com/H4nke2/lottery-everyone.git
```

进入lottery-everyone目录执行命令：

```sh
node server.js
```

访问`localhost:3000`即可，管理员访问`localhost:3000/set`来设置抽奖.

## Docker构建

拉取docker镜像：

```dockerfile
docker pull h4nke2/lottery
```

创建容器：

```sh
docker run -itd -p 3000:3000 h4nke2/lottery
```
## docker-compose一键部署
编写`docker-compose.yml`
```sh
version: "3.8"
services:
  lottery:
    container_name: "lottory_everyone"
    image: "h4nke2/lottery:v3"
    ports:
      - "3000:3000"
```
运行下面命令部署创建容器：
```sh
docker-compose up -d
```
