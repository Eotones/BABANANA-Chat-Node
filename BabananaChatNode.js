const io = require('socket.io-client');
const fetch = require('node-fetch');
const EventEmitter = require('events');
const CryptoJS = require("crypto-js");
const uuidv1 = require('uuid/v1');

class BabananaChatNode extends EventEmitter {
    constructor(type, chat_room_id){
        super();
        
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
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36'
            }
        });

        this.socket_gift = io('https://ctl.lv-show.com', {
            secure: true,
            transports: ['websocket'],
            path: '/socket.io',
            autoConnect: false,
            extraHeaders: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36'
            }
        });
        */
        
        this.socket_chat = io('wss://chat-web.lang.live/chat_nsp', {
            secure: true,
            transports: ['websocket'],
            path: '/chat_nsp',
            autoConnect: false,
            extraHeaders: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36'
            }
        });

        this.socket_gift = io('wss://control-web.lang.live/control_nsp', {
            secure: true,
            transports: ['websocket'],
            path: '/control_nsp',
            autoConnect: false,
            extraHeaders: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36'
            }
        });

        this.type = type;
        this.chat_room_id = chat_room_id;
    }

    start(){
        this._get_room_info();
    }

    _get_room_info(){
        fetch(
            `https://game-api.lang.live/webapi/v1/room/info?room_id=${this.chat_room_id}`,
            {
                method: 'get', // GET, POST
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.83 Safari/537.36',
                    'content-type': 'application/json',
                    'Host': 'game-api.lang.live',
                    'Referer': `https://play.lang.live/${this.chat_room_id}`
                },
                cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
                mode: 'cors', // no-cors, cors, *same-origin
            }
        ).then((res) => {
            return res.json();
        }).then((json) => {
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
                
                if(this.type == 'chat'){
                    this._webSocket_chat(tokens);
                }
                else if(this.type == 'gift'){
                    this._webSocket_gift(tokens);
                }

                // tokens['nickname'] = this.htmlEncode(json.data.live_info.nickname);
                // tokens['room_title'] = this.htmlEncode(json.data.live_info.room_title);
            }
        });
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
            this.emit('connect');

            //傳送認證token
            setTimeout(() => {
                console.log('傳送認證token');
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
            console.log('error');
            console.log(data);
        });

        //connect_error
        this.socket_chat.on('connect_error', (data) => {
            //
            console.log('connect_error');
            console.log(data);
        });

        //ping
        this.socket_chat.on('ping', () => {
            console.log('ping');
        });

        //pong
        this.socket_chat.on('pong', () => {
            console.log('pong');
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
            this.emit('connect');

            //傳送認證token
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
        });

        //連線中斷
        this.socket_gift.on('disconnect', () => {
            //console.log('disconnect');
            this.emit('disconnect', data);
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
            }
        });
    }
}

module.exports = BabananaChatNode;