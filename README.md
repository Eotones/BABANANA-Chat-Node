# BABANANA-Chat-Node

浪Play(Kingkong) unofficial websocket module

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

const chat_room_id = '2132991'; //國動台2132991

const kk_chat = new BabananaChatNode('chat', chat_room_id);
const kk_gift = new BabananaChatNode('gift', chat_room_id);

//定義event事件處理
(() => {
    // ===== chat ws server =====
    
    //直播狀態
    kk_chat.on('live-status', (data) => {
        if(data == "online"){
            console.log(`[chat/直播狀態] 線上`);
        }else{
            console.log(`[chat/直播狀態] 離線`);
        }
    });


    //連線成功
    kk_chat.on('connect', (data) => {
        console.log(`[chat/連線成功] ${data}`);
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

        //純文字無貼圖
        console.log(`[chat/聊天訊息] ${role}${data.name}: ${data.msg}`);

        //含html貼圖
        let msg_with_sticker = kk_chat.sticker_tag_to_img_html(data.msg, data.vip_fan); //貼圖tag轉html圖片
        console.log(`[chat/聊天訊息] ${role}${data.name}: ${msg_with_sticker}`);
    });

    //進入訊息
    kk_chat.on('join', (data) => {
        console.log(`[chat/進入訊息] [${data.name}] 進入聊天室`);
    });

    //錯誤訊息
    kk_chat.on('error', (data) => {
        console.log(`[chat/錯誤訊息] start`);
        console.error(data);
        console.log(`[chat/錯誤訊息] end`);
    });


    // ===== gift ws server =====
    //連線成功
    kk_gift.on('connect', (data) => {
        console.log(`[gift/連線成功] ${data}`);
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
        let gift_name = kk_gift.gift_id_to_name(data.data.prod_id, '禮物'); //禮物id轉中文名稱,第2個參數是還未取得禮物名稱時的預設名稱
        console.log(`[gift/禮物] ${data.data.f_nickname} 送出 ${data.data.prod_cnt}個 [${gift_name}]`);
        console.log(`[gift/禮物] 禮物圖片連結: ${data.data.img}`)
    });

    //浪花語音
    kk_gift.on('_bullet_send', (data) => {
        console.log(`[gift/浪花語音] ${data.data.f_nickname}: ${data.data.msg}`);
    });

    //錯誤訊息
    kk_gift.on('error', (data) => {
        console.log(`[gift/錯誤訊息] start`);
        console.error(data);
        console.log(`[gift/錯誤訊息] end`);
    });

    //聊天室房號切換(會發生在開台和關台時)
    //房號切換後需要重新取得新的連線token才能連線(已新增自動重連功能)
    kk_gift.on('_switch_chat_room', () => {
        console.log(`[gift/房號切換]`);
    });
})();



(async () => {
    //若發生嚴重錯誤則強制中斷程式
    try {
        //聊天ws
        await kk_chat.start();
    
        //禮物ws
        await kk_gift.start();
    } catch (error) {
        console.error('error');
        console.error(error);
        
        process.exit(); //強制中斷程式
    }
})();
```

## 版本說明

### v2.0.1
* [update] "socket.io-client" : "2.3.1" to "2.4.0"
    * "socket.io-client"有更新版本的3.*和4.*,但是因為這兩個版本沒有向下相容server所以無法升上去
* [update] "xmlhttprequest-ssl" : "1.5.5" to "1.6.2"

### v2.0.0
* 新增開關台後自動切換房號重連功能
* 取得禮物列表和圖片連結
* 取得表情貼圖和文字訊息轉換成有貼圖的html
* 加強錯誤處理
    * 會讓程式無法繼續運行的嚴重錯誤使用throw Error(用try...catch攔截讓程式中斷運行),例:
        * 參數填寫錯誤
        * 驗證token失敗(照常理來說一次過不了後面也不會過)
    * 小錯誤不影響程式運行用error event處理(可重複嘗試的錯誤,例如暫時性的連線失敗),例:
        * 官方API連線失敗(可能是暫時性或被阻擋)
        * websocket連線失敗或中斷(可能是暫時性或被阻擋)

### v1.0.0
* 基本功能(能動)


## License
MIT