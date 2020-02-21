# BABANANA-Chat-Node

Kingkong unofficial websocket module

* 純node.js版websocket module
* 瀏覽器的`fetch()`沒有修改headers的權限,所以不能在瀏覽器運作
* 只有訪客權限,所以只能讀訊息,不能發送訊息
* BABANANA Chat 其他版本:
    * 網頁版: https://banana.eotones.net/
    * 桌面版: https://github.com/Eotones/BABANANA-Chat-Desktop (內嵌網頁版)

## 用法1(git clone)

```shell
$ git clone https://github.com/Eotones/BABANANA-Chat-Node.git
$ cd BABANANA-Chat-Node
$ npm i
$ npm run example
```

## 用法2(npm導入)

```shell
$ npm init
$ npm install github:Eotones/BABANANA-Chat-Node
# touch index.js
# vim index.js
#新增以下內容
#然後
$ node index.js
```

index.js:
```javascript
const BabananaChatNode = require('babanana-chat-node');

//const chat_room_id = '2282757'; //館長
const chat_room_id = '2132991'; //國動

const kk_chat = new BabananaChatNode('chat', chat_room_id);
const kk_gift = new BabananaChatNode('gift', chat_room_id);


//聊天ws
kk_chat.start();

//連線成功
kk_chat.on('connect', () => {
    console.log(`[chat/連線成功]`);
});

//連線中斷
kk_chat.on('disconnect', () => {
    console.log(`[chat/連線中斷]`);
});

//認證失敗
kk_chat.on('unauthorized', (data) => {
    console.log(`[chat/認證失敗] ${data}`);
});

//認證成功
kk_chat.on('authenticated', (data) => {
    console.log(`[chat/認證成功] ${data}`);
});

//聊天訊息
kk_chat.on('msg', (data) => {
    let role = "";
    if(data.is_admin == true){
        role = "[管理] ";
    }
    if (data.pfid == chat_room_id) {
        role = "[主播] ";
    }
    if (data.role == 1) {
        role = "[官方] ";
    }

    console.log(`[chat/聊天訊息] ${role}${data.name}: ${data.msg}`);
});

//進入訊息
kk_chat.on('join', (data) => {
    console.log(`[chat/進入訊息] [${data.name}] 進入聊天室`);
});



//禮物ws
kk_gift.start();

//連線成功
kk_gift.on('connect', () => {
    console.log(`[gift/連線成功]`);
});

//連線中斷
kk_gift.on('disconnect', () => {
    console.log(`[gift/連線中斷]`);
});

//認證成功
kk_gift.on('authenticated', (data) => {
    console.log(`[gift/認證成功] ${data}`);
});

//認證失敗
kk_gift.on('unauthorized', (data) => {
    console.log(`[gift/認證失敗] ${data}`);
});

//熱度
kk_gift.on('_live_heat', (data) => {
    console.log(`[gift/熱度] ${data}`);
});

//觀眾數
kk_gift.on('_live_view', (data) => {
    console.log(`[gift/觀眾數] ${data}`);
});

//禮物
kk_gift.on('_gift_send', (data) => {
    console.log(`[gift/禮物] ${data.data.f_nickname} 送出 ${data.data.prod_cnt}個 [${data.data.prod_id}]`);
});
```
