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

export function compareTrue () {
    return true;
    }
    
export var cEvent = function(a,b,c,d){
    d = d || {};
    d.inner = true;
    webix.event(a,b,c,d);
};

export var fRefresh = function(master, node, value){
    node.component = master.config.id;
    master.registerFilter(node, value, this);
    node._comp_id = master.config.id;
    if (value.value && this.getValue(node) != value.value) this.setValue(node, value.value);
    node.onclick = webix.html.preventEvent;
    cEvent(node, "keydown", this.on_key_down);
    };

export var rRefresh = function(master, node, value){
    if (master.$destructed) return;
    var select = webix.$$(value.richselect);
    node.$webix = value.richselect;
    node.style.marginLeft = "-10px";
    value.compare = value.compare || this.compare;
    value.prepare = value.prepare || this.prepare;
    master.registerFilter(node, value, this);
    var data = value.inputConfig.options;
    var options = value.options;
    var list = select.getPopup().getList();
    var optview = webix.$$(options);
    node.firstChild.appendChild(select.$view.parentNode);
    if (list.parse){
        list.clearAll();
        list.parse(data);
        if ((!this.$noEmptyOption && value.emptyOption !== false) || value.emptyOption){
            var emptyOption = { id:"", value: value.emptyOption||"", $empty: true };
            list.add(emptyOption,0);
            }
        };
    if (value.value) this.setValue(node, value.value);
    select.render();
    webix.delay(select.resize, select);
    }

export var rRender = function(chFunc) {
    return function(master, config){
        if (!config.richselect){
            var d = webix.html.create("div", { "class" : "webix_richfilter" });
            var richconfig = {
                container:d,
                view:this.inputtype,
                options:[]
                };
            var inputConfig = webix.extend( this.inputConfig||{}, config.inputConfig||{}, true );
            webix.extend(richconfig, inputConfig, true);
            if (config.separator) richconfig.separator = config.separator;
            if (config.suggest) richconfig.suggest = config.suggest;
            var richselect = webix.ui(richconfig);
            richselect.attachEvent("onChange", chFunc);
            config.richselect = richselect.config.id;
            //console.log('master', master);
            //console.log('master._d', master._destroy_with_me);
            //master._destroy_with_me.push(richselect);
            };
        config.css = "webix_div_filter";
        return " ";
        }
    }

export var fRender = function(master, config){
    if (this.init) this.init(config);
    config.css = "my_filter";
    return "<input "+(config.placeholder?('placeholder="'+config.placeholder+'" '):"")+"type='text'>";
    };
    
export function checkKey(code) {
    let ret = false;
    if (code === 8 || code === 13 || code === 32 || code === 46 || (code > 47 && code < 91) || (code > 95 && code < 112) || (code > 185 && code < 193) || (code > 219 && code < 223)) ret = true;
    return ret
    }

export function checkVal(result, mode) {
    var ret_value;
    var err;
    if (mode === 's') {
        ret_value = JSON.parse(result);
    } else if (mode === 'a') {
        ret_value = result.json();
        };
    if (ret_value.result) {
        ret_value = ret_value.ret_val;
    } else {
        ret_value = undefined;
        err = 'error';
        }
    if (err) webix.message({'type': 'debug', 'text': err});
    return ret_value;
    }

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

export function parseToLink(item){
    let suppl_dt = $$("_suppl").getList()
    let data = suppl_dt.data.order;
    let cid;
    data.forEach(function(d_item, i, data) {
        if (suppl_dt.getItem(d_item).c_vnd === item.c_vnd) {
            cid = suppl_dt.getItem(d_item).id;
            };
        });
    if (cid) {
        suppl_dt.getItem(cid).count += 1;
        $$("_suppl").setValue(cid);
        setTimeout(function() {
            prcs.add(item, 0);
            prcs.setCursor(cid);
            parse_unlinked_item(this, item);
            }, 800);
    } else {
        let p_item = {"id": 'new', "count": 1, "c_vnd": item.c_vnd, "id_vnd": item.id_vnd}
        suppl_dt.add(p_item);
        $$("_suppl").setValue('new');
        setTimeout(function() {
            prcs.clearAll();
            prcs.add(item, 0);
            let iid = prcs.data.order[0];
            prcs.setCursor(iid);
            parse_unlinked_item(this, item);
            }, 800);
        };
    }


export function get_bars(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getBar"
    let params = {"user": user, "id_spr": id_spr};
    let res = request(url, params, !0).response;
    res = checkVal(res, 's');
    if (res) {
        $$("bars_dc").clearAll();
        $$("bars_dc").parse(res);
        };
    }

export function get_tg(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getTg"
    let params = {"user": user, "id_spr": id_spr};
    let res = request(url, params, !0).response;
    res = checkVal(res, 's');
    if (res) {
        $$("tg_dc").clearAll();
        $$("tg_dc").parse(res);
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
    let cbars = inp_params.cbars;
    let view = inp_params.view;
    let nav = inp_params.navBar;
    let start = inp_params.start;
    let count = inp_params.count;
    let se_s = inp_params.searchBar;
    let method = inp_params.method;
    let field = (inp_params.field) ? inp_params.field : undefined;
    let s_field = (inp_params.s_field) ? inp_params.s_field : undefined;
    let direction = (inp_params.direction) ? inp_params.direction : undefined;
    let search_str = (se_s) ? $$(se_s).getValue() : undefined;
    let c_filter = (inp_params.filter) ? inp_params.filter : undefined;
    let app = $$("main_ui").$scope.app;
    let user = app.config.user;
    let url = app.config.r_url + "?" + method;
    let params = {"user": user, "search": search_str, "start": start, "count": count, "field": field, "direction": direction, "c_filter": c_filter, "cbars": cbars};
    let old_stri = $$(view).config.old_stri;
    let rl = (typeof search_str !== "undefined") ? search_str.replace(/\ /g, "").length : 2;
    let sl = (typeof search_str !== "undefined") ? search_str.length : 2;
    if (sl > 1 && rl > 1) { ////////////////////
        $$(view).config.old_stri = search_str;
        $$(view).showProgress({
            type: "icon",
            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
            });
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            if (data) {
                //console.log('data', data);
                $$(view).parse(data.datas);
                $$(view).config.startPos = data.start;
                $$(view).config.totalPos = data.total;
                form_navi(view, nav);
                let hist = webix.storage.session.get(view);
                if (hist) {
                    hist.push(search_str)
                } else {
                    hist = [search_str,]
                    }
                webix.storage.session.put(view, hist);
            } else {
                $$(view).clearAll();
                webix.message('error');
                };
            $$(view).hideProgress();
            });
        } else {
            };
    }

export function parse_unlinked_item(th, c_item) {
    c_item = (c_item) ? c_item : $$("prcs_dc").getItem($$("prcs_dc").getCursor());
    let n_item = {} 
    let link = "https://www.google.ru/search?newwindow=1&q=" + c_item.c_tovar;
    let name = "<a target='_balnk' href='" + link + "'><span>" + c_item.c_tovar + "</span></a>";
    let count = "<span style='color: #666666; text-decoration: underline;'>Осталось свести в текущей сессии:</span><span style='color: red; font-weight: bold;'>  "+ $$("prcs_dc").count() + "</span>";
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
    $$("_spr_search").focus();
    }

export function get_spr(th, id_spr) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getSpr"
    let params = {"user": user, "id_spr": id_spr};
    let res = request(url, params, !0).response;
    res = checkVal(res, 's');
    if (res) {
        return res[0]
    } else {
        webix.message('error');
        return 'error';
        };
    }

export function getDtParams(ui) {
    let c_filter;
    if (ui.config.id === "__ttl") {
        c_filter = {
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').value : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_tovar'  : ($$(ui).isColumnVisible('id_tovar')) ? $$(ui).getFilter('id_tovar').value : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'spr'       : ($$(ui).isColumnVisible('spr')) ? $$(ui).getFilter('spr').value : undefined,
            'owner'     : ($$(ui).isColumnVisible('owner')) ? $$(ui).getFilter('owner').value :undefined,
            };
    } else if (ui.config.id === "__tt") {
        c_filter = {
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').value : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_tovar'  : ($$(ui).isColumnVisible('id_tovar')) ? $$(ui).getFilter('id_tovar').value : undefined,
            'owner'     : ($$(ui).isColumnVisible('owner')) ? $$(ui).getFilter('owner').value :undefined,
            };
    } else if (ui.config.id === "__dt_a") {
        c_filter = {
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').value : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'c_tovar'   : ($$(ui).isColumnVisible('c_tovar')) ? $$(ui).getFilter('c_tovar').value : undefined,
            'c_user'    : ($$(ui).isColumnVisible('c_user')) ? $$(ui).getFilter('c_user').value : undefined,
            };
    } else if (ui.config.id === "__dt_s") {
        c_filter = {
            'c_tovar'   : ($$(ui).isColumnVisible('c_tovar')) ? $$(ui).getFilter('c_tovar').value : undefined,
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').value : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            };
    } else if (ui.config.id === "__dt_as") {
        c_filter = {
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'id_zavod'  : ($$(ui).isColumnVisible('id_zavod')) ? $$(ui).getFilter('id_zavod').value : undefined,
            'id_strana' : ($$(ui).isColumnVisible('id_strana')) ? $$(ui).getFilter('id_strana').value : undefined,
            'c_dv'      : ($$(ui).isColumnVisible('c_dv')) ? $$(ui).getFilter('c_dv').value : undefined,
            'c_group'   : ($$(ui).isColumnVisible('c_group')) ? $$(ui).getFilter('c_group').value : undefined,
            'c_nds'     : ($$(ui).isColumnVisible('c_nds')) ? $$(ui).getFilter('c_nds').getValue() : undefined,
            'c_hran'    : ($$(ui).isColumnVisible('c_hran')) ? $$(ui).getFilter('c_hran').getValue() : undefined,
            'c_sezon'   : ($$(ui).isColumnVisible('c_sezon')) ? $$(ui).getFilter('c_sezon').getValue() : undefined,
            'mandat'    : ($$(ui).isColumnVisible('mandat')) ? $$(ui).getFilter('mandat').getValue() : undefined,
            'prescr'    : ($$(ui).isColumnVisible('prescr')) ? $$(ui).getFilter('prescr').getValue() : undefined,

            };
        }
        
    return [c_filter, ui.config.posPpage, ui.config.fi, ui.config.di]
    }

export function dt_formating_sec(d) {
    return webix.Date.dateToStr("%d-%m-%Y  %G:%i:%s")(d)
    };
    
export function dt_formating(d) {
    return webix.Date.dateToStr("%d-%m-%Y")(d)
    };

export function init_first(app) {
    //console.log('app', app);
    let delay = app.config.searchDelay;
    setTimeout(get_refs, 2*delay, {"app": app, "type": "async", "method": "getStranaAll", "store": "strana_dc"});
    setTimeout(get_refs, 2*delay, {"app": app, "type": "async", "method": "getVendorAll", "store": "vendor_dc"});
    setTimeout(get_refs, 3*delay, {"app": app, "type": "async", "method": "getDvAll", "store": "dv_dc"});
    setTimeout(get_refs, 3*delay, {"app": app, "type": "async", "method": "getNdsAll", "store": "nds_dc"});
    setTimeout(get_refs, 4*delay, {"app": app, "type": "async", "method": "getHranAll", "store": "hran_dc"});
    setTimeout(get_refs, 4*delay, {"app": app, "type": "async", "method": "getSezonAll", "store": "sezon_dc"});
    setTimeout(get_refs, 5*delay, {"app": app, "type": "async", "method": "getGroupAll", "store": "group_dc"});
    setTimeout(get_refs, 5*delay, {"app": app, "type": "async", "method": "getTgAll", "store": "allTg_dc"});
    }

export function get_prcs(th, id_vnd) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcs"
    let params = {"user": user, "id_vnd": +id_vnd};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            //data = data.data;
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
            data = checkVal(data, 'a');
            if (data) {
                //data = data.data;
                $$(store).clearAll();
                $$(store).parse(data);
            } else {
                webix.message('error');
                };
            })
    } else {
        let res = request(url, params, !0).response;
        res = checkVal(res, 's');
        if (res) {
            $$(store).clearAll();
            $$(store).parse(res);
            };
        };
    }

export function get_suppl(view, th) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getSupplUnlnk"
    let params = {"user": user};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            //data = data.data;
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
    //let sh_prc = inp_data.sh_prc;
    //console.log('sh', sh_prc);
    let cursor = prcs.getCursor();
    prcs.remove(cursor);
    if (prcs.count() < 1){
        get_suppl("_suppl", th)
    } else {
        cursor = prcs.data.order[0];
        prcs.setCursor(cursor);
        parse_unlinked_item();
        let ll = $$("_suppl").getList();
        let cc = $$("_suppl").getValue();
        let iti = ll.getItem(cc);
        iti.count = iti.count - 1;
        ll.updateItem(cc, iti);
        $$("_suppl").refresh();
        };
    }
    
export function filter_1(item, value) {
    value = value.toString().toLowerCase()
    value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
    return item.c_vnd.toString().toLowerCase().search(value) != -1;
    }

export function after_call(i, ii, iii) {
    //console.log('iii', iii.status);
    deleteCookie('linker_user');
    deleteCookie('linker_auth_key');
    deleteCookie('linker_role');
    location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/linker/";
    }

export function request (url, params, mode) {
    var req;
    req = (mode === !0) ? webix.ajax().sync().headers({'Content-type': 'application/json'}).post(url, params, {error: after_call})
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

