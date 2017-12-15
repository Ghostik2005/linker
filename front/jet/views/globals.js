"use strict";

export var prcs = new webix.DataCollection({
        id: "prcs_dc",
        on: {
            onAfterLoad: function() {
                let cur_pos = this.data.order[0]
                this.setCursor(cur_pos);
                parse_unlinked_item();
                }
            }
        });

export var strana = new webix.DataCollection({
        id: "strana_dc",
        on: {
            onAfterLoad: function() {
                //console.log(this)
                }
            }
        });

export var vendor = new webix.DataCollection({
        id: "vendor_dc",
        on: {
            onAfterLoad: function() {
                //console.log(this)
                }
            }
        });

export var dv = new webix.DataCollection({
        id: "dv_dc",
        on: {
            onAfterLoad: function() {
                //console.log(this)
                }
            }
        });


export function get_spr_search(th, re) {
    let user = (th) ? th.app.config.user : "user";
    let url = (th) ? th.app.config.r_url + "?getSprSearch" : "/linker_logic?getSprSearch";
    let params = {"user": user, "search": re};
    request(url, params).then(function(data) {
        data = data.json();
        if (data.result) {
            data = data.ret_val
            $$("__dt").clearAll();
            $$("__dt").parse(data);
        } else {
            webix.message('error');
            };
        })
    }

export function parse_unlinked_item(th) {
    let c_item = $$("prcs_dc").getItem($$("prcs_dc").getCursor());
    $$("_names_bar").elements._vendor.setValue(c_item.c_zavod);
    let link = "https://www.google.ru/search?newwindow=1&q=" + c_item.c_tovar;
    let name = "<a target='_balnk' href='" + link + "'><span>" + c_item.c_tovar + "</span></a>";
    let count = "<span style='color: #666666;'>Осталось свести: </span><span style='color: red; font-weight: bold;'>"+ $$("prcs_dc").count() + "</span>";
    $$("_names_bar").elements._name.setValue(name);
    $$("_names_bar").elements._count.setValue(count);
    let buf = c_item.c_tovar.split(' ');
    let sta = 0;
    if (buf[sta].length < 4) sta += 1;
    let s_stri = buf[sta];
    for (var i = sta; i < buf.length; i++ ){
        var tmp = buf[i];
        for (var n=0; n < tmp.length; n++ ){
            let ttt = parseInt(tmp[n], 10);
            let q = !isNaN(tmp[n]);
            if( q ){
                s_stri += ' ' + tmp[n];
                }
            }
        }
    s_stri = s_stri.replace('"', " ");
    s_stri = s_stri.replace("-", " ");
    s_stri = s_stri.replace(".", " ");
    s_stri = s_stri.replace("*", " ");
    s_stri = s_stri.replace("+", " ");
    s_stri = s_stri.replace("/", " ");
    s_stri = s_stri.replace("\\", " ");
    $$("_spr_search").setValue(s_stri);
    get_spr_search(th, s_stri);
    }

export function get_spr(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getSpr"
    let params = {"user": user, "id_spr": id_spr};
    let item = request(url, params, !0).response;
    item = JSON.parse(item);
    if (item.result) {
        return item.ret_val[0]
    } else {
        webix.message('error');
        return 'error';
        };
    }

export function get_prcs(th, id_vnd) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcs"
    let params = {"user": user, "id_vnd": +id_vnd, "not_link": 0};
    request(url, params).then(function(data) {
        data = data.json();
        if (data.result) {
            data = data.ret_val
            $$("prcs_dc").clearAll();
            $$("prcs_dc").parse(data);
        } else {
            webix.message('error');
            };
        })
    }

export function get_strana_all(app) {
    let user = app.config.user;
    let url = app.config.r_url + "?getStranaAll"
    let params = {"user": user};
    request(url, params).then(function(data) {
        data = data.json();
        if (data.result) {
            data = data.ret_val
            $$("strana_dc").clearAll();
            $$("strana_dc").parse(data);
        } else {
            webix.message('error');
            };
        })
    }

export function get_vendor_all(app) {
    let user = app.config.user;
    let url = app.config.r_url + "?getVendorAll"
    let params = {"user": user};
    request(url, params).then(function(data) {
        data = data.json();
        if (data.result) {
            data = data.ret_val
            $$("vendor_dc").clearAll();
            $$("vendor_dc").parse(data);
        } else {
            webix.message('error');
            };
        })
    }

export function get_dv_all(app) {
    let user = app.config.user;
    let url = app.config.r_url + "?getDvAll"
    let params = {"user": user};
    request(url, params).then(function(data) {
        data = data.json();
        if (data.result) {
            data = data.ret_val
            $$("dv_dc").clearAll();
            $$("dv_dc").parse(data);
        } else {
            webix.message('error');
            };
        })
    }

export function get_suppl(view, th) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getSupplUnlnk"
    let params = {"user": user};
    request(url, params).then(function(data) {
        data = data.json();
        if (data.result) {
            data = data.ret_val
            $$(view).getList().clearAll();
            $$(view).getList().parse(data);
            let fid = $$(view).getList().getFirstId();
            $$(view).setValue(fid);
        } else {
            webix.message('error');
            };
        })
    }
    
export function filter_1(item, value) {
    value = value.toString().toLowerCase()
    value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
    return item.c_vnd.toString().toLowerCase().search(value) != -1;
    }

export function request (url, params, mode) {
    var req = (mode === !0) ? webix.ajax().sync().headers({'Content-type': 'application/json'}).post(url, params):
        webix.ajax().headers({'Content-type': 'application/json'}).post(url, params)
    return req
    }

export function getCookie(name) {
    var matches = document.cookie.match(new RegExp(
        "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : NaN;
    };

export function setCookie(name, value, options) {
    options = options || {};
    var expires = options.expires;
    if (typeof expires == "number" && expires) {
        var d = new Date();
        d.setTime(d.getTime() + expires * 1000);
        expires = options.expires = d;
    };
    if (expires && expires.toUTCString) {
        options.expires = expires.toUTCString();
    };
    value = encodeURIComponent(value);
    var updatedCookie = name + "=" + value;
    for (var propName in options) {
        updatedCookie += "; " + propName;
        var propValue = options[propName];
        if (propValue !== true) {
            updatedCookie += "=" + propValue;
        };
    };
    document.cookie = updatedCookie;
    }

export function deleteCookie (name) {
    //var opt = {domain: location.hostname};
    setCookie(name, "", {
        'expires': -1, 'path': '/'
        })
    }


/*
        var base = 0;

        function loadNext(){
            base += 10;
            grida.loadNext(10, base);
        }
        function loadPrev(){
            if (base<=0) return;
            base -= 10;
            grida.loadNext(10, base);
        }

        var grida = webix.ui({
            container:"testA",
            view:"datatable",
            columns:[
                { id:"id", header:"", css:{"text-align":"center"}, width:50 },
                { id:"package", header:"Name",          width:200 },
                { id:"section", header:"Section",       width:120 },
                { id:"size",    header:"Size" ,         width:80  },
                { id:"architecture",    header:"PC",    width:60  }
            ],
            on:{
                //clear self before data loading
                "data->onParse":function(){
                    this.clearAll();
                    this.data.url = "data/data.php";
                }
            },
            yCount:10,
            autowidth:true
        });
        grida.loadNext(10,0,null,"data/data_dyn.php");
*/
