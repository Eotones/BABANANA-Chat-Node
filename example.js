const BabananaChatNode = require('./BabananaChatNode.js');

const chat_room_id = '2132991'; //國動台2132991
//const chat_room_id = '7777777'; //

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
        //console.log(`[chat/聊天訊息] ${role}${data.name}: ${data.msg}`);

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