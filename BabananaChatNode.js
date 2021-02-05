const io = require('socket.io-client');
const fetch = require('node-fetch');
const EventEmitter = require('events');
const CryptoJS = require("crypto-js");
const uuidv1 = require('uuid/v1');

const userAgent_default = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36';

class BabananaChatNode extends EventEmitter {
    constructor(type, chat_room_id, userAgent = userAgent_default){
        super();

        this.type = type;
        this.chat_room_id = chat_room_id;
        this.userAgent = userAgent;

        this.gift_list = [];
        this.get_sticker_obj = {};
        
        /*
        this.socket_chat = io('wss://cht.ws.kingkong.com.tw/chat_nsp', {
            secure: true,
            transports: ['websocket'],
            path: '/chat_nsp',
            autoConnect: false
        });

        this.socket_gift = io('wss://ctl.ws.kingkong.com.tw/control_nsp', {
            secure: true,
            transports: ['websocket'],
            path: '/control_nsp',
            autoConnect: false
        });
        */
        
        /*
        this.socket_chat = io('https://cht.lv-show.com', {
            secure: true,
            transports: ['websocket'],
            path: '/socket.io',
            autoConnect: false,
            extraHeaders: {
                'User-Agent': this.userAgent
            }
        });

        this.socket_gift = io('https://ctl.lv-show.com', {
            secure: true,
            transports: ['websocket'],
            path: '/socket.io',
            autoConnect: false,
            extraHeaders: {
                'User-Agent': this.userAgent
            }
        });
        */
        
        this.socket_chat = io('wss://chat-web.lang.live/chat_nsp', {
            secure: true,
            transports: ['websocket'],
            path: '/chat_nsp',
            autoConnect: false,
            extraHeaders: {
                'User-Agent': this.userAgent
            }
        });

        this.socket_gift = io('wss://control-web.lang.live/control_nsp', {
            secure: true,
            transports: ['websocket'],
            path: '/control_nsp',
            autoConnect: false,
            extraHeaders: {
                'User-Agent': this.userAgent
            }
        });
    }

    start(){
        return this._get_room_info();
    }

    _fetch(api_url, api_host, api_referer){
        return fetch(
            api_url,
            {
                method: 'get', // GET, POST
                headers: {
                    'User-Agent': this.userAgent,
                    'content-type': 'application/json',
                    'Host': api_host,
                    'Referer': api_referer
                },
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                mode: 'cors', // no-cors, cors, *same-origin
            }
        ).then((res) => {
            if (res.ok){
                return res.json();
            }else{
                this.emit('api-error', '官方api連線失敗');
            }
        });
    }

    _get_room_info(){
        let api_url = `https://game-api.lang.live/webapi/v1/room/info?room_id=${this.chat_room_id}`;
        let api_host = `game-api.lang.live`;
        let api_referer = `https://play.lang.live/${this.chat_room_id}`;
        
        return this._fetch(api_url, api_host, api_referer).then((json) => {
            //console.log(json);
    
            if( (typeof json != "undefined") && (typeof json.data != "undefined") ){
                let tokens = [];
    
                tokens['room_id'] = json.data.live_info.room_id; //2282757
                tokens['uid'] = json.data.live_info.uid; //2282757
    
                tokens['live_id'] = json.data.live_info.live_id;
                tokens['live_key'] = json.data.live_info.live_key;
                tokens['token'] = this._create_kk_guest_token(tokens['live_id'],tokens['live_key']);
                
                //console.log(tokens);
                //console.log(tokens['token']);

                if(json.data.live_info.live_status == 1){
                    this.emit('live-status', 'online');
                }else{
                    this.emit('live-status', 'offline');
                }
                
                if(this.type == 'chat'){
                    this._webSocket_chat(tokens);

                    this._get_room_sticker_list(); //取得貼圖列表
                }
                else if(this.type == 'gift'){
                    this._webSocket_gift(tokens);

                    this._get_gift_list(); //取得禮物列表
                }

                // tokens['nickname'] = this.htmlEncode(json.data.live_info.nickname);
                // tokens['room_title'] = this.htmlEncode(json.data.live_info.room_title);
            }
        });
    }

    _get_gift_list(){ //取得禮物編號和中文名稱的對應列表
        let api_url = `https://game-api.lang.live/webapi/v1/gift/list?anchor_pfid=${this.chat_room_id}`;
        let api_host = `game-api.lang.live`;
        let api_referer = `https://play.lang.live/${this.chat_room_id}`;

        this._fetch(api_url, api_host, api_referer).then((json) => {
            //console.log(json);
    
            if( (typeof json != "undefined") && (typeof json.data != "undefined") ){
                this.emit('lang_api', '取得禮物列表');

                json.data.backlist.forEach((element) => {
                    let _gift_id = (element.id).toString();
                    this.gift_list[_gift_id] = element.name;
                });

                json.data.giftlist.forEach((element) => {
                    let _gift_id = (element.id).toString();
                    this.gift_list[_gift_id] = element.name;
                });
            }
        }).catch(() => {
            this.emit('error', '取得禮物列表失敗');
        });
    }

    gift_id_to_name(_gift_id, gift_default_name = '禮物'){
        //let _gift_name = this.gift_list[_gift_id];
        if(typeof this.gift_list[_gift_id] !== "undefined" && this.gift_list.length >= 1){
            return this.gift_list[_gift_id];
        }else{
            return gift_default_name;
        }
    }

    _get_room_sticker_list(){ //取得聊天室貼圖列表
        let api_url = `https://play-api.lang.live/playapi-node/v1/stickers/list?anchor_pfid=${this.chat_room_id}`;
        let api_host = `play-api.lang.live`;
        let api_referer = `https://play.lang.live/${this.chat_room_id}`;

        this._fetch(api_url, api_host, api_referer).then((json) => {
            //console.log(json);
    
            if( (typeof json != "undefined") && (typeof json.data != "undefined") && (typeof json.data.list != "undefined") && json.data.list.length >= 1 ){
                this.emit('lang_api', '取得貼圖列表');

                this.get_sticker_obj = json.data.list;

                // json.data.lsit.forEach((element) => {
                //     //todo: 要補上貼圖權限檢查 element.sticker_level
                //     let _sticker_name = (element.sticker_name).toString();
                //     this.sticker_list[_sticker_name] = element.sticker_img;
                // });
            }
        }).catch(() => {
            this.emit('error', '取得貼圖列表失敗');
        });
    }

    sticker_tag_to_img_html(_msg, _vip_fan = 0){ //留言貼圖tag轉html圖片
        let _msg_with_sticker = _msg;
    
        if(typeof get_sticker_obj !== "undefined" && get_sticker_obj.length >= 1){
            for(let i = 0; i < get_sticker_obj.length; i++){
                if(_vip_fan >= get_sticker_obj[i].sticker_level){
                    // let _img_ele = document.createElement("img");
                    // _img_ele.src = get_sticker_obj[i].sticker_img.medium;
                    // _img_ele.alt = get_sticker_obj[i].sticker_name;
                    // _img_ele.classList = "lang_sticker";
                    // let _img_ele_str = _img_ele.outerHTML;
                    // _img_ele = null;
                    
                    _msg_with_sticker = _msg_with_sticker.replace(`[${get_sticker_obj[i].sticker_name}]`, `<img src="${get_sticker_obj[i].sticker_img.medium}" alt="${get_sticker_obj[i].sticker_name}" class="lang_sticker">`);
                    //_msg_with_sticker = _msg_with_sticker.replace(`[${get_sticker_obj[i].sticker_name}]`, _img_ele_str);
                    //_msg_with_sticker = _msg_with_sticker.split(`[${get_sticker_obj[i].sticker_name}]`).join(_img_ele_str);
                }
            }

            return _msg_with_sticker;
        }else{
            return _msg;
        }
    }

    _create_kk_guest_token(live_id,live_key){
        let kk_pfid = this._kk_makePFID();
        let kk_name = this._kk_getName(kk_pfid);

        let jwt_header = {
            alg: "HS256",
            typ: "JWT"
        };
        let jwt_header_base64 = this._base64urlEncoding(CryptoJS.enc.Utf8.parse(JSON.stringify(jwt_header)));
    
        let jwt_payload = {
            live_id : live_id,
            pfid : kk_pfid,
            name : kk_name,
            access_token : null,
            lv : 1,
            from : 1,
            from_seq : 1,
            channel_id : 1,
            client_type : "web"
        };
        let jwt_payload_base64 = this._base64urlEncoding(CryptoJS.enc.Utf8.parse(JSON.stringify(jwt_payload)));
    
        let i = `${jwt_header_base64}.${jwt_payload_base64}`;
        let n = live_key;
    
        let jwt_Signature = CryptoJS.HmacSHA256(i, n);
        let jwt_Signature_base64 = this._base64urlEncoding(jwt_Signature);
    
    
        return `${jwt_header_base64}.${jwt_payload_base64}.${jwt_Signature_base64}`;
    }

    _base64urlEncoding(t){
        let e = CryptoJS.enc.Base64.stringify(t);
        e = e.replace(/=+$/, "");
        e = e.replace(/\+/g, "-");
        e = e.replace(/\//g, "_");
        return e;
    }

    _kk_makePFID(){
        let t = uuidv1().toString().replace(/-/g, "");
        t = t.substring(0, t.length);
        return t;
    }

    _kk_getName(t){
        let e;
        e = "訪客" + t.toString().substring(t.length - 5, t.length);
        return e;
    }

    _webSocket_chat(tokens){
        

        //連線成功
        this.socket_chat.on('connect', () => {
            //console.log('connect');
            this.emit('connect', 'websocket連線成功');

            //傳送認證token
            setTimeout(() => {
                //console.log('傳送認證token');
                this.emit('connect', 'websocket傳送認證token');

                this.socket_chat.emit(
                    'authentication',
                    {
                        "live_id": tokens['live_id'],
                        "anchor_pfid": tokens['room_id'],
                        "access_token": tokens['token'],
                        "token": tokens['token'],
                        "from": "WEB",
                        "client_type": "web",
                        "r": 0
                    }
                );
            }, 1500);
        });

        //連線中斷
        this.socket_chat.on('disconnect', () => {
            //console.log('disconnect');
            this.emit('disconnect');
        });

        //認證失敗
        this.socket_chat.on('unauthorized', (data) => {
            //console.log('unauthorized', data);
            this.emit('unauthorized', data);
        });

        //認證成功
        this.socket_chat.on('authenticated', (data) => {
            //console.log('authenticated', data);
            this.emit('authenticated', data);
        });

        //收到訊息
        this.socket_chat.on('msg', (data) => {
            //console.log('msg', data);
            //console.log(`${data.name}: ${data.msg}`);

            this.emit('msg', data);
        });

        //使用者加入訊息
        this.socket_chat.on('join', (data) => {
            //console.log('join', data);
            //console.log(`[${data.name}] 加入`);
            this.emit('join', data);
        });

        //error
        this.socket_chat.on('error', (data) => {
            //
            //console.log('error');
            //console.log(data);
            this.emit('error', data);
        });

        //connect_error
        this.socket_chat.on('connect_error', (data) => {
            //
            //console.log('connect_error');
            //console.log(data);
            this.emit('error', data);
        });

        //ping
        this.socket_chat.on('ping', () => {
            //console.log('ping');
            this.emit('ping');
        });

        //pong
        this.socket_chat.on('pong', () => {
            //console.log('pong');
            this.emit('pong');
        });

        //開啟連線
        this.socket_chat.open();
    }

    _webSocket_gift(tokens){
        //開啟連線
        this.socket_gift.open();

        //連線成功
        this.socket_gift.on('connect', () => {
            //console.log('connect');
            this.emit('connect', 'websocket連線成功');

            //傳送認證token
            setTimeout(() => {
                //console.log('傳送認證token');
                this.emit('connect', 'websocket傳送認證token');

                this.socket_gift.emit(
                    'authentication',
                    {
                        "live_id": tokens['live_id'],
                        "anchor_pfid": tokens['room_id'],
                        "access_token": tokens['token'],
                        "token": tokens['token'],
                        "from": "WEB",
                        "client_type": "web",
                        "r": 0
                    }
                );
            }, 1500);
        });

        //連線中斷
        this.socket_gift.on('disconnect', () => {
            //console.log('disconnect');
            this.emit('disconnect');
        });

        //認證失敗
        this.socket_gift.on('unauthorized', (data) => {
            //console.log('unauthorized', data);
            this.emit('unauthorized', data);
        });

        //認證成功
        this.socket_gift.on('authenticated', (data) => {
            //console.log('authenticated', data);
            this.emit('authenticated', data);
        });

        //room_customize
        this.socket_gift.on('room_customize', (data) => {
            //console.log('join', data);

            switch(data.data.Event){
                case "gift_send": //禮物
                    //let gift_text = `${data.data.f_nickname} 送出 ${data.data.prod_cnt}個 [${data.data.prod_id}]`;
                    //console.log(gift_text);
                    this.emit('_gift_send', data);
                    break;
                case "live_heat": //熱度
                    //let heat_text = `熱度: ${data.data.heat}`;
                    //console.log(heat_text);
                    this.emit('_live_heat', data.data.heat);
                    break;
                case "liun": //觀眾數
                    //let heat_text = `觀眾數: ${data.data.user_cnt_p}`;
                    //console.log(heat_text);
                    this.emit('_live_view', data.data.user_cnt_p);
                    break;
                case "bullet_send": //浪花語音
                    //
                    this.emit('_bullet_send', data);
                    break;
                case "switch_chat_room": //開關台時切換聊天室房號
                    this.emit('_switch_chat_room');
                    this._webSocket_auto_switch_room();
                    break;
            }
        });
    }

    _webSocket_auto_switch_room(){ //開關台時自動切換聊天室房號
        //切斷舊房號連線
        this.socket_chat.disconnect();
        this.socket_gift.disconnect();

        setTimeout(()=>{
            this._get_room_info();
        }, 10000); //10秒後切換
    }
}

module.exports = BabananaChatNode;