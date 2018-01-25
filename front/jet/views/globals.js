"use strict";
import {JetApp, JetView} from "webix-jet";

export var barcodes = new webix.DataCollection({
        id: "bars_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });

export var tg = new webix.DataCollection({
        id: "tg_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });


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

export var allTg = new webix.DataCollection({
        id: "allTg_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });


export var strana = new webix.DataCollection({
        id: "strana_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });

export var vendor = new webix.DataCollection({
        id: "vendor_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });

export var dv = new webix.DataCollection({
        id: "dv_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });

export var nds = new webix.DataCollection({
        id: "nds_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });

export var sezon = new webix.DataCollection({
        id: "sezon_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });

export var hran = new webix.DataCollection({
        id: "hran_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });

export var group = new webix.DataCollection({
        id: "group_dc",
        on: {
            onAfterLoad: function() {
                }
            }
        });

export function addHran(item) {
    hran.add(item);
    }

export function delHran(item_id) {
    hran.remove(item_id);
    }

export function updHran(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.usloviya = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    //hran.updateItem(item.id, item.value);
    }

export function addStrana(item) {
    strana.add(item);
    }

export function delStrana(item_id) {
    strana.remove(item_id);
    }

export function updStrana(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_strana = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addDv(item) {
    dv.add(item);
    }

export function delDv(item_id) {
    dv.remove(item_id);
    }

export function updDv(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.act_ingr = item.value;
    citem.oa = item.oa;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addNds(item) {
    nds.add(item);
    }

export function delNds(item_id) {
    nds.remove(item_id);
    }

export function updNds(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.nds = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addSez(item) {
    sezon.add(item);
    }

export function delSez(item_id) {
    sezon.remove(item_id);
    }

export function updSez(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.sezon = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addGr(item) {
    group.add(item);
    }

export function delGr(item_id) {
    group.remove(item_id);
    }

export function updGr(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.group = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function addVendor(item) {
    vendor.add(item);
    }

export function delVendor(item_id) {
    vendor.remove(item_id);
    }

export function updVendor(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_zavod = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function last_page(view) {
    let total = $$(view).config.totalPos;
    let ppp = $$(view).config.posPpage;
    let lp = (Math.ceil(total/ppp) - 1) * ppp + 1
    return lp
    }

export function get_bars(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getBar"
    let params = {"user": user, "id_spr": id_spr};
    let item = request(url, params, !0).response;
    item = JSON.parse(item);
    if (item.result) {
        $$("bars_dc").clearAll();
        $$("bars_dc").parse(item.ret_val);
    } else {
        };
    }

export function get_tg(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getTg"
    let params = {"user": user, "id_spr": id_spr};
    let item = request(url, params, !0).response;
    item = JSON.parse(item);
    if (item.result) {
        console.log(item.ret_val);
        $$("tg_dc").clearAll();
        $$("tg_dc").parse(item.ret_val);
    } else {
        };
    }

export function form_navi(view, pager) {
    let c_page = $$(view).config.startPos / $$(view).config.posPpage;
    let total_page = $$(view).config.totalPos / $$(view).config.posPpage;
    total_page = Math.ceil(total_page);
    let pa = $$(pager).getChildViews()[2]
    let co = $$(pager).getChildViews()[6]
    c_page = (total_page !== 0) ? Math.ceil(c_page) : 0;
    pa.define('label', "Страница " + c_page + " из " + total_page);
    pa.refresh();
    co.define('label', "Всего записей: " + $$(view).config.totalPos);
    co.refresh();
    }

export function get_data(inp_params) {
    let th = inp_params.th;
    //console.log(th.getBody());
    let view = inp_params.view;
    let nav = inp_params.navBar;
    let start = inp_params.start;
    let count = inp_params.count;
    let se_s = inp_params.searchBar;
    let method = inp_params.method;
    let field = (inp_params.field) ? inp_params.field : undefined;
    let direction = (inp_params.direction) ? inp_params.direction : undefined;
    let search_str = $$(se_s).getValue();
    let app = $$("main_ui").$scope.app;
    //console.log('gdata', app);
    //console.dir(JetView);
    let user = (th) ? th.app.config.user : app.config.user;
    let u1 = (location.hostname === 'localhost') ? "http://saas.local/linker_logic?" : "../linker_logic?";
    let url = (th) ? th.app.config.r_url + "?" + method : u1 + method;
    let params = {"user": user, "search": search_str, "start": start, "count": count, "field": field, "direction": direction};
    let old_stri = $$(view).config.old_stri;
    if (old_stri !== search_str || old_stri === search_str) { ////////////////////
        $$(view).config.old_stri = search_str;
        $$(view).showProgress({
            type: "icon",
            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
            });
        request(url, params).then(function(data) {
            data = data.json();
            if (data.result) {
                $$(view).clearAll();
                $$(view).parse(data.ret_val);
                $$(view).config.startPos = data.start;
                $$(view).config.totalPos = data.total;
                form_navi(view, nav);
            } else {
                webix.message('error');
                };
            });
        } else {
            //console.log('yes');
            };
    }

export function parse_unlinked_item(th, c_item) {
    c_item = (c_item) ? c_item : $$("prcs_dc").getItem($$("prcs_dc").getCursor());
    let n_item = {} 
    let link = "https://www.google.ru/search?newwindow=1&q=" + c_item.c_tovar;
    let name = "<a target='_balnk' href='" + link + "'><span>" + c_item.c_tovar + "</span></a>";
    let count = "<span style='color: #666666;'>Осталось свести в текущей сессии: </span><span style='color: red; font-weight: bold;'>"+ $$("prcs_dc").count() + "</span>";
    n_item['_name'] = name;
    n_item['_count'] = count;
    n_item['_vendor'] = c_item.c_zavod;
    n_item['p_name'] = c_item.c_tovar;
    $$("_names_bar").parse(n_item);
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
    s_stri = s_stri.replace('!', " ");
    s_stri = s_stri.replace("-", " ");
    s_stri = s_stri.replace(".", " ");
    s_stri = s_stri.replace("*", " ");
    s_stri = s_stri.replace("+", " ");
    s_stri = s_stri.replace("/", " ");
    s_stri = s_stri.replace("\\", " ");
    $$("prcs_dc").config.old_stri = s_stri;
    $$("_spr_search").setValue(s_stri);
    count = $$("__dt").config.posPpage;
    get_data({
        th: th,
        view: "__dt",
        navBar: "__nav",
        start: 1,
        count: count,
        searchBar: "_spr_search",
        method: "getSprSearch"
        });
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

export function init_first(app) {
    setTimeout(get_refs, 0, {"app": app, "type": "async", "method": "getStranaAll", "store": "strana_dc"});
    setTimeout(get_refs, 5500, {"app": app, "type": "async", "method": "getVendorAll", "store": "vendor_dc"});
    setTimeout(get_refs, 4500, {"app": app, "type": "async", "method": "getDvAll", "store": "dv_dc"});
    setTimeout(get_refs, 0, {"app": app, "type": "async", "method": "getNdsAll", "store": "nds_dc"});
    setTimeout(get_refs, 0, {"app": app, "type": "async", "method": "getHranAll", "store": "hran_dc"});
    setTimeout(get_refs, 0, {"app": app, "type": "async", "method": "getSezonAll", "store": "sezon_dc"});
    setTimeout(get_refs, 0, {"app": app, "type": "async", "method": "getGroupAll", "store": "group_dc"});
    setTimeout(get_refs, 0, {"app": app, "type": "async", "method": "getTgAll", "store": "allTg_dc"});
    }

export function get_prcs(th, id_vnd) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcs"
    let params = {"user": user, "id_vnd": +id_vnd};
    //let data = request(url, params, !0).response;
    //data = JSON.parse(data);
    //if (data.result) {
        //data = data.ret_val
        //$$("prcs_dc").clearAll();
        //$$("prcs_dc").parse(data);
    //} else {
        //webix.message('error');
        //};
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

export function get_refs(inp_params){
    let app = inp_params.app;
    let method = inp_params.method;
    let store = inp_params.store;
    let user = app.config.user;
    let url = app.config.r_url + "?" + method
    let params = {"user": user};
    let type = inp_params.type;
    if (type !== "sync") {
        request(url, params).then(function(data) {
            data = data.json();
            if (data.result) {
                data = data.ret_val
                $$(store).clearAll();
                $$(store).parse(data);
            } else {
                webix.message('error');
                };
            })
    } else {
        let data = request(url, params, !0).response;
        data = JSON.parse(data);
        if (data.result) {
            data = data.ret_val
            $$(store).clearAll();
            $$(store).parse(data);
        } else {
            webix.message('error');
            };
        };
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
        }).then(function() {
            //init_first(th.app)
        })
    }

export function delPrc(inp_data, th) {
    let sh_prc = inp_data.sh_prc;
    let cursor = prcs.getCursor() 
    let data = prcs.data.order;
    let _c;
    data.forEach(function(item, i, data) {
        if (item === cursor) _c = +i
        });
    _c = _c + 1;
    if (_c === prcs.count()) _c = 0;
    prcs.remove(cursor);
    cursor = prcs.data.order[+_c];
    prcs.setCursor(cursor);
    if (prcs.count() < 1){
        get_suppl("_suppl", th)
    } else {
        parse_unlinked_item();
        };
    }
    
export function filter_1(item, value) {
    value = value.toString().toLowerCase()
    value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
    return item.c_vnd.toString().toLowerCase().search(value) != -1;
    }

export function after_call(i, ii, iii) {
    if (iii.status === 403) {
        console.log('iii', iii);
        deleteCookie('linker_user');
        deleteCookie('linker_auth_key');
        let u1 = (location.hostname === 'localhost') ? "http://localhost:8080" : "/linker/";
        //console.log($$("main_ui").$scope.app);
        location.href = u1;
        }
    }

export function request (url, params, mode) {
    var req = (mode === !0) ? webix.ajax().sync().headers({'Content-type': 'application/json'}).post(url, params, {error: after_call})
        : webix.ajax().headers({'Content-type': 'application/json'}).post(url, params, {error: after_call})
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

