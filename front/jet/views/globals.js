"use strict";

import {permited_add} from "../models/variables";

export var u_roles = new webix.DataCollection({
        id: "roles_dc",
        });

export var barcodes = new webix.DataCollection({
        id: "bars_dc",
        });

export var prcs = new webix.DataCollection({
        id: "prcs_dc",
        on: {
            onAfterLoad: function() {
                let cur_pos = this.data.order[0];
                this.setCursor(cur_pos);
                let th = $$("main_ui");
                let state = $$("_suppl").config.state;
                if (state) {
                    $$("_suppl").config.state = false;
                } else {
                    parse_unlinked_item(th);
                    };
                },
            }
        });

export var allIs = new webix.DataCollection({
        id: "allIs_dc",
        });

export var strana = new webix.DataCollection({
        id: "strana_dc",
        });

export var vendor = new webix.DataCollection({
        id: "vendor_dc",
        });

export var dv = new webix.DataCollection({
        id: "dv_dc",
        });

export var nds = new webix.DataCollection({
        id: "nds_dc",
        });

export var sezon = new webix.DataCollection({
        id: "sezon_dc",
        });

export var hran = new webix.DataCollection({
        id: "hran_dc",
        });

export var group = new webix.DataCollection({
        id: "group_dc",
        });

export function compareTrue () {
    return true;
    }
    
export var cEvent = function(a,b,c,d){
    d = d || {};
    d.inner = true;
    webix.event(a,b,c,d);
    };

export var unFilter = function(cv) {
    var columns = cv.config.columns;
    columns.forEach(function(item){
        if (item.id && (item.id!=='checkbox') && cv.isColumnVisible(item.id) && item.header[1] && item.header[1].content) {
            let filt = cv.getFilter(item.id);
            if (typeof(filt.setValue) === 'function') {
                filt.blockEvent();
                filt.setValue('');
                filt.unblockEvent();
            } else {
                if (!filt.readOnly) filt.value = '';
                };
            }
        });
    }
        
export function checkKey(code) {
    return (code === 8 || code === 13 || code === 32 || code === 46 || (code > 47 && code < 91) || (code > 95 && code < 112) || (code > 185 && code < 193) || (code > 219 && code < 223)) ? true : false
    }

export function checkVal(result, mode) {
    var ret_value;
    if (mode === 's') {
        ret_value = JSON.parse(result);
    } else if (mode === 'a') {
        ret_value = result.json();
        };
    if (ret_value.result) {
        ret_value = ret_value.ret_val;
    } else {
        ret_value = undefined;
        }
    return ret_value;
    }

export function getStorageFromName(name){
    return $$(name[0].toLowerCase() + name.slice(1) + "_dc");
}

export function addItem(storage, item, source) {
    storage = getStorageFromName(storage);
    source.add(item, 0);
    storage.add(item, 0);
}

export function delItem(storage, item, source) {
    storage = getStorageFromName(storage);
    source.remove(item, 0);
    storage.remove(item, 0);
}

export function getFieldFromName(name){
    return (name === 'Nds') ? 'nds' :
            (name === 'Dv') ? 'act_ingr' :
            (name === 'Group') ? 'group' :
            (name === 'Hran') ? 'usloviya' :
            (name === 'AllIs') ? 'c_issue' :
            (name === 'Sezon') ? 'sezon' :
            (name === 'Strana') ? 'c_strana' :
            (name === 'Vendor') ? 'c_zavod' :
            ""
}

export function updItem(storage, item, source) {
    let field = getFieldFromName(storage)
    storage = getStorageFromName(storage);
    var cid = item.id;
    let citem = source.getItem(cid);
    citem[field] = item.value;
    source.updateItem(cid, citem);
    storage.updateItem(cid, citem);
    source.refresh();
}

export function addTGr(item, source) {
    item.c_tgroup = item.group;
    delete item.group;
    source.add(item, 0);
    }

export function delTGr(item_id, source) {
    source.remove(item_id);
    }

export function updTGr(item, source) {
    var cid = item.id; 
    let citem = source.getItem(cid);
    citem.c_tgroup = item.value;
    source.updateItem(cid, citem);
    source.refresh();
    }

export function parseToLink(item){
    let suppl_dt = $$("_suppl").getList()
    let data = suppl_dt.data.order;
    let cid;
    let app = $$("main_ui").$scope.app
    let url = app.config.r_url + "?setWork"
    let params = {"user": app.config.user, "sh_prc": item.sh_prc};
    checkVal(request(url, params, !0).response, 's');
    data.forEach(function(d_item, i, data) {
        if (suppl_dt.getItem(d_item).c_vnd === item.c_vnd) {
            cid = suppl_dt.getItem(d_item).id;
            };
        });
    if (cid) {
        suppl_dt.getItem(cid).count += 1;
        $$("_suppl").setValue(cid);
        setTimeout(function(){
            let ii = prcs.getItem(item.id);
            if (!ii) {
                prcs.add(item, 0);
                let iid = prcs.data.order[0];
                prcs.setCursor(iid);
                parse_unlinked_item(this, item);
            } else {
                prcs.setCursor(item.id);
                parse_unlinked_item(this, item);
                }
            }, 400);
    } else {
        let min = 1000000000000;
        let max = 2000000000000;
        var rand = Math.round(min - 0.5 + Math.random() * (max - min + 1));
        let p_item = {"id": rand, "count": 1, "c_vnd": item.c_vnd, "id_vnd": item.id_vnd}
        $$("_suppl").config.manual = true;
        suppl_dt.add(p_item);
        $$("_suppl").setValue(rand);
        setTimeout(function(){
            prcs.clearAll();
            prcs.add(item, 0);
            let iid = prcs.data.order[0];
            prcs.setCursor(iid);
            parse_unlinked_item(this, item);
        }, 400);
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

export function refLoad(app, type) {
    let params ={"user": app.config.user};
    let r_url = app.config.r_url;
    let data = [];
    let url = (type === 'gr') ? "?getGroupAll":
              (type === 'dv') ? "?getDvAll":
              (type === 'sezon') ? "?getSezonAll":
              (type === 'hran') ? "?getHranAll":
              (type === 'issue') ? "?getIssueAll":
              (type === 'nds') ? "?getNdsAll":
              undefined
    if (url) {
        url = r_url + url;
        data = refReload(url, params)
    } else {
        data = [
            {"id": "_set_", "value": "Установить"},
            {"id": "_unset_", "value": "Снять"},
        ];
    };
    if (data.length > 2) {
        data.forEach( function(item) {
            item.value = (type === 'gr') ? item.group:
                      (type === 'dv') ? item.act_ingr:
                      (type === 'sezon') ? item.sezon:
                      (type === 'hran') ? item.usloviya:
                      (type === 'issue') ? item.c_issue:
                      (type === 'nds') ? item.nds:
                      undefined
        })
    }
    return data
}

export function refReload(url, params, async) {
    if (async) {
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            if (data) {
                async.parse(data);
            };
        })
    } else {
        let data = request(url, params, !0).response;
        data = checkVal(data, 's');
        if (data) {
            return data;
        } else {
            return [];
        };
    }
}

export function singleRefReload(app, method, parent) {
    let url = app.config.r_url + "?" + method;
    let params = {"user": app.config.user};
    return refReload(url, params, parent)
}

export function get_tg(app, id_spr) {
    let user = app.config.user;
    let url = app.config.r_url + "?getTg"
    let params = {"user": user, "id_spr": id_spr};
    let res = request(url, params, !0).response;
    res = checkVal(res, 's');
    if (res) {
        return res;
    } else {
        return [];
    };
}

export function clear_obj(obj) {
    for (var k in obj) {
        let val = obj[k];
        if (typeof(val) === 'object') {
            val = clear_obj(val)
        } else {
            if (val==undefined) {
                delete obj[k];
            }
        }
    }
    return obj
}

export function gen_params(inp_params) {
    let view = inp_params.view;
    let app = view.$scope.app;
    let se_s = inp_params.searchBar;
    let field = (inp_params.field) ? inp_params.field : undefined;
    let direction = (inp_params.direction) ? inp_params.direction : undefined;
    let search_str = (se_s) ? $$(se_s).getValue() : undefined;
    let c_filter = (inp_params.filter) ? inp_params.filter : undefined;
    let user = app.config.user;
    let url = app.config.r_url + "?" + inp_params.method;
    let params = {"user": user, "search": search_str, "start": inp_params.start, "count": inp_params.count,
                  "field": field, "direction": direction, "c_filter": c_filter, "cbars": inp_params.cbars, "total": inp_params.total};
    params = clear_obj(params);
    return params
}

export function str_join(obj) {
    let ret = '';
    if (typeof(obj) === 'string') {
        ret = obj;
    } else {
        for (var k in obj) {
            let val = obj[k];
            if (val && typeof(val) === 'object' && val.__proto__.hasOwnProperty('getDate')) {
                var a = [val.getFullYear(), val.getMonth() + 1, val.getDate(), val.getHours(), val.getMinutes()];
                for (var i=0; i<a.length; i++) {
                    if (a[i]<10) {
                        a[i]='0'+a[i]
                    } else {
                        a[i]=a[i].toString()
                    } 
                }
                let q = a.slice(0,3).join('-') + " " + a[3] + ":" + a[4];
                ret += q.toString();
            } else if (typeof(val) === 'object') {
                // val = str_join(val);
                ret += str_join(val);
            } else {
                ret += val.toString()
            }
        }
    }
    return ret
}

export function get_data_test(inp_params) {
    let view = inp_params.view;
    let app = view.$scope.app;
    if (view) view.clearAll();
    let nav = inp_params.navBar;
    let url = app.config.r_url + "?" + inp_params.method;
    let params = gen_params(inp_params);
    let search_str = params.search;
    if (search_str === "") search_str="%%";
    let rl = (typeof search_str !== "undefined") ? search_str.replace(/\ /g, "").length : 2;
    let sl = (typeof search_str !== "undefined") ? search_str.length : 2;
    if (sl > 1 && rl > 1) {
        view.showProgress({
            type: "icon",
            icon: '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>'
            });
        var selected = webix.storage.session.get(view.config.name+"sel") || {};
        let old_p = selected.s_pars;
        if (view.bState && view.bState === 1) {
            let localStorage = webix.storage.session.get(view.config.name+"sel");
            params['id_sprs'] = [];
            Object.keys(localStorage).forEach((item)=>{
                if (localStorage[item]) params['id_sprs'].push(item);
            });
        };
        let n_p = JSON.parse(JSON.stringify(params));
        delete(n_p.start);
        let reset = false;
        if (str_join(n_p) === str_join(old_p)) {
        } else {
            if ((n_p.id_sprs && old_p && !old_p.id_sprs) || (!n_p.id_sprs && old_p && old_p.id_sprs)) {
            } else {
                selected = {"s_pars": n_p};
                webix.storage.session.put(view.config.name+"sel", selected);
                reset = true;
            }
        };
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            if (data) {
                if (data.params) {
                    let d_params = JSON.parse(JSON.stringify(data['params']))
                    delete d_params.id_sprs;
                    let c_params = str_join(gen_params(inp_params));
                    let r_params = str_join(d_params);
                    if (r_params !== c_params) { 
                        view.hideProgress();
                        return
                    }
                }
                view.parse(data.datas);
                view.config.startPos = data.start;
                view.config.totalPos = data.total;
                let bar_view = view.getTopParentView().getChildViews()[1].getChildViews()[0].getChildViews()[1].getChildViews()[1];
                if (bar_view) {
                    let bar_view_node = bar_view.$view.childNodes[1].getElementsByClassName('webix_selected')[0]
                    bar_view_node.title = "Всего позиций: " + view.config.totalPos;
                };
                let total_page = Math.ceil(view.config.totalPos / view.config.posPpage);
                let c_page = (total_page !== 0) ? Math.ceil(view.config.startPos / view.config.posPpage) : 1;
                let pa = nav.getChildViews()[2]
                let co = nav.getChildViews()[6]
                webix.storage.session.put(view.config.name+'_pages', total_page);
                if (reset === true) {
                    if (view.$scope.scroll) {
                        setTimeout( function() {
                            let tp = +webix.storage.session.get(view.config.name+'_pages');
                            let h = +view.$scope.scroll.config.container.clientHeight;
                            let p = tp*h;
                            view.$scope.scroll.pageNumber = 1;
                            view.$scope.scroll.define("scrollHeight", p);
                            view.$scope.scroll.reset();
                        }, 0)
                    }
                }
                co.define('label', "Всего записей: " + view.config.totalPos);
                co.refresh();
                let old_p = nav.$scope.$$("__page").getValue()
                if (+old_p !==c_page) nav.$scope.$$("__page").config.manual = false;
                let pa1 = pa.getChildViews();
                pa1[2].define('label', total_page);
                pa1[2].refresh();
                nav.$scope.$$("__page").setValue(c_page);
                nav.$scope.$$("__page").refresh();
                let hist = webix.storage.session.get(view.config.name);
                if (hist) {
                    if (search_str !== "%%") hist.push(search_str);
                } else {
                    let ssstr = (search_str !== "%%") ? search_str : ''
                    hist = [ssstr,]
                    }
                webix.storage.session.put(view.config.name, hist);
                };
            view.hideProgress();
            });
        } else {
            };
 
    }

export function parse_unlinked_item(th, c_item) {
    c_item = c_item || $$("prcs_dc").getItem($$("prcs_dc").getCursor());
    let n_item = {} 
    let link = "https://www.google.ru/search?newwindow=1&q=" + c_item.c_tovar;
    let name = "<a target='_blank' rel='noreferrer noopener' href='" + link + "'><span>" + c_item.c_tovar + "</span></a>";
    let count = "<span style='color: #666666; text-decoration: underline;'>Осталось свести в текущей сессии:</span><span style='color: red; font-weight: bold;'>  "+ $$("prcs_dc").count() + "</span>";
    n_item['_name'] = name;
    n_item['_count'] = count;
    n_item['_vendor'] = c_item.c_zavod;
    n_item['p_name'] = c_item.c_tovar;
    let app_c = $$("main_ui").$scope.app.config;
    if (app_c.roles[app_c.role].spradd) $$("_add").show();

    // console.log("c_item", permited_add);

    if (permited_add.id_vnds.includes(c_item.id_vnd) && permited_add.users.includes(app_c.user)) $$("_add").show();

    $$("_left").show();
    $$("_skip").show();
    $$("_right").show();
    $$("_names_bar").parse(n_item);
    let buf = c_item.c_tovar.split(' ');
    let sta = 0;
    if (buf[sta].length < 4) sta += 1;
    let s_stri = buf[sta];
    for (var i = sta; i < buf.length; i++ ){
        for (var n=0; n < buf[i].length; n++ ){
            let q = !isNaN(buf[i][n]);
            if (q) s_stri += ' ' + buf[i][n];
        }
    }
    s_stri = s_stri.replace('"', " ");
    s_stri = s_stri.replace('!', " ");
    s_stri = s_stri.replace("-", " ");
    s_stri = s_stri.replace(".", " ");
    s_stri = s_stri.replace(",", " ");
    s_stri = s_stri.replace("*", " ");
    s_stri = s_stri.replace("+", " ");
    s_stri = s_stri.replace("/", " ");
    s_stri = s_stri.replace("\\", " ");
    $$("_spr_search").setValue(s_stri);
    let vv = $$('app-nav').getChildViews()[3].getChildViews(); //datatable form
    let dtParams = getDtParams(vv[0]);
    get_data_test({
        view: vv[0],
        navBar: vv[1],
        start: 1,
        searchBar: vv[0].config.searchBar,
        method: vv[0].config.searchMethod,
        field: dtParams[2],
        direction: dtParams[3],
        filter: dtParams[0],
        count: dtParams[1],
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
    if (ui.config.name === "__ttl") {
        c_filter = {
            'id'        : ($$(ui).isColumnVisible('id')) ? $$(ui).getFilter('id').value : undefined,
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_tovar'  : ($$(ui).isColumnVisible('id_tovar')) ? $$(ui).getFilter('id_tovar').value : undefined,
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'spr'       : ($$(ui).isColumnVisible('spr')) ? $$(ui).getFilter('spr').value : undefined,
            'owner'     : ($$(ui).isColumnVisible('owner')) ? $$(ui).getFilter('owner').value :undefined,
            'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            };
    } else if (ui.config.name === "__tt") {
        c_filter = {
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            // 'id_tovar'  : ($$(ui).isColumnVisible('id_tovar')) ? $$(ui).getFilter('id_tovar').value : undefined,
            'owner'     : ($$(ui).isColumnVisible('owner')) ? $$(ui).getFilter('owner').value :undefined,
            };
    } else if (ui.config.name === "__dt_sk") {
        c_filter = {
            // 'id_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'status'     : ($$(ui).isColumnVisible('status')) ? $$(ui).getFilter('status').getValue() : undefined,
            // 'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            // 'id_org'    : ($$(ui).isColumnVisible('id_org')) ? $$(ui).getFilter('id_org').value : undefined,
            // 'sklad_c_tovar'   : ($$(ui).isColumnVisible('sklad_c_tovar')) ? $$(ui).getFilter('sklad_c_tovar').value : undefined,
            // 'sh_prc'   : ($$(ui).isColumnVisible('sh_prc')) ? $$(ui).getFilter('sh_prc').value : undefined,
            // 'c_user'    : ($$(ui).isColumnVisible('c_user')) ? $$(ui).getFilter('c_user').getText() : undefined,
            // 'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            };
    } else if (ui.config.name === "__dt_a") {
        c_filter = {
            //'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getText() : undefined,
            'id_tovar'   : ($$(ui).isColumnVisible('id_tovar')) ? $$(ui).getFilter('id_tovar').value : undefined,
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_org'    : ($$(ui).isColumnVisible('id_org')) ? $$(ui).getFilter('id_org').value : undefined,
            'c_tovar'   : ($$(ui).isColumnVisible('c_tovar')) ? $$(ui).getFilter('c_tovar').value : undefined,
            'sh_prc'   : ($$(ui).isColumnVisible('sh_prc')) ? $$(ui).getFilter('sh_prc').value : undefined,
            'c_user'    : ($$(ui).isColumnVisible('c_user')) ? $$(ui).getFilter('c_user').getText() : undefined,
            'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            };
    } else if (ui.config.name === "__dt_s") {
        c_filter = {
            'id_tovar'   : ($$(ui).isColumnVisible('id_tovar')) ? $$(ui).getFilter('id_tovar').value : undefined,
            'c_tovar'   : ($$(ui).isColumnVisible('c_tovar')) ? $$(ui).getFilter('c_tovar').value : undefined,
            'sh_prc'   : ($$(ui).isColumnVisible('sh_prc')) ? $$(ui).getFilter('sh_prc').value : undefined,
            //'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getText() : undefined,
            'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getValue() : undefined,
            'c_zavod'   : ($$(ui).isColumnVisible('c_zavod')) ? $$(ui).getFilter('c_zavod').value : undefined,
            'id_org'    : ($$(ui).isColumnVisible('id_org')) ? $$(ui).getFilter('id_org').value : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            };
    } else if (ui.config.name === "__dt_as") {
        c_filter = {
            "price"     : ($$(ui).isColumnVisible('price')) ? $$(ui).getFilter('price').getValue() : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'id_zavod'  : ($$(ui).isColumnVisible('id_zavod')) ? $$(ui).getFilter('id_zavod').getValue() : undefined,
            'id_strana' : ($$(ui).isColumnVisible('id_strana')) ? $$(ui).getFilter('id_strana').getValue() : undefined,
            'c_dv'      : ($$(ui).isColumnVisible('c_dv')) ? $$(ui).getFilter('c_dv').getValue() : undefined,
            'c_group'   : ($$(ui).isColumnVisible('c_group')) ? $$(ui).getFilter('c_group').getValue() : undefined,
            't_group'   : ($$(ui).isColumnVisible('t_group')) ? $$(ui).getFilter('t_group').getValue() : undefined,
            'c_nds'     : ($$(ui).isColumnVisible('c_nds')) ? $$(ui).getFilter('c_nds').getValue() : undefined,
            'c_hran'    : ($$(ui).isColumnVisible('c_hran')) ? $$(ui).getFilter('c_hran').getValue() : undefined,
            'c_sezon'   : ($$(ui).isColumnVisible('c_sezon')) ? $$(ui).getFilter('c_sezon').getValue() : undefined,
            'mandat'    : ($$(ui).isColumnVisible('mandat')) ? $$(ui).getFilter('mandat').getValue() : undefined,
            'prescr'    : ($$(ui).isColumnVisible('prescr')) ? $$(ui).getFilter('prescr').getValue() : undefined,
            };
    } else if (ui.config.name === "__dt") {
        c_filter = {
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'c_dv'      : ($$(ui).isColumnVisible('c_dv')) ? $$(ui).getFilter('c_dv').getValue() : undefined,
            };
    } else if (ui.config.name === "__brak") {
        c_filter = {
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            };
    } else if (ui.config.name === "rlslink") {
        c_filter = {
            //'c_vnd'     : ($$(ui).isColumnVisible('c_vnd')) ? $$(ui).getFilter('c_vnd').getText() : undefined,
            'c_vnd'     : 51078,
            'id_org'    : ($$(ui).isColumnVisible('id_org')) ? $$(ui).getFilter('id_org').value : undefined,
            //'c_tovar'   : ($$(ui).isColumnVisible('c_tovar')) ? $$(ui).getFilter('c_tovar').value : undefined,
            'sh_prc'   : ($$(ui).isColumnVisible('sh_prc')) ? $$(ui).getFilter('sh_prc').value : undefined,
            'c_user'    : ($$(ui).isColumnVisible('c_user')) ? $$(ui).getFilter('c_user').getText() : undefined,
            'source'    : ($$(ui).isColumnVisible('source')) ? $$(ui).getFilter('source').getValue() : undefined,
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            };
    } else if (ui.config.name === "relink") {
        c_filter = {
            'dt'        : ($$(ui).isColumnVisible('dt')) ? $$(ui).getFilter('dt').getValue() : undefined,
            'id_spr'    : ($$(ui).isColumnVisible('id_spr')) ? $$(ui).getFilter('id_spr').value : undefined,
            'id_zavod'  : ($$(ui).isColumnVisible('id_zavod')) ? $$(ui).getFilter('id_zavod').getValue() : undefined,
            'id_strana' : ($$(ui).isColumnVisible('id_strana')) ? $$(ui).getFilter('id_strana').getValue() : undefined,
            'c_dv'      : ($$(ui).isColumnVisible('c_dv')) ? $$(ui).getFilter('c_dv').getValue() : undefined,
            'c_group'   : ($$(ui).isColumnVisible('c_group')) ? $$(ui).getFilter('c_group').getValue() : undefined,
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

export function mcf_filter (obj, value){
    value = value.toString().toLowerCase()
    value = new RegExp(".*" + value.replace(/ /g, ".*") + ".*");
    return obj.value.toString().toLowerCase().search(value) != -1;
    };
    
export function init_first(app) {

    webix.i18n.setLocale('ru-RU');

    webix.protoUI({
        name:"activeList"
        },webix.ui.list, webix.ActiveContent);
        
    webix.protoUI({
        name: "cWindow",
        defaults: {
            resize: true,
            modal: false,
            move: true,
            position: "center"
            },
        $init: function(config){
            webix.extend(config, {
                head: {
                    view: "toolbar",
                    cols: [
                        {view: "label", label: "Название окна"},
                        {view: "button",
                            type: "icon",
                            icon: "times",
                            css: "times",
                            height: 26,
                            width:26,
                            on: {
                                onItemClick: function () {
                                    this.getTopParentView().hide();
                                },
                            },
                        }
                    ]
                }
            })
        }
    }, webix.ui.window);

    webix.ui.datafilter.richFilt = Object.create(webix.ui.datafilter.richSelectFilter);
    webix.ui.datafilter.richFilt.refresh = function(master, node, value){
        if (master.$destructed) return;
        var select = webix.$$(value.richselect);
        node._comp_id = master.config.id;
        node.$webix = value.richselect;
        node.style.marginLeft = "-10px";
        value.compare = value.compare || this.compare;
        value.prepare = value.prepare || this.prepare;
        master.registerFilter(node, value, this);
        var addEmpty = (value.inputConfig) ? value.inputConfig.emptyRow : undefined;
        var data = value.inputConfig.options;
        var options = value.options;
        var list = select.getPopup().getList();
        var optview = webix.$$(options);
        node.firstChild.appendChild(select.$view.parentNode);
        if (list.parse){
            list.clearAll();
            list.parse(data);
            if (addEmpty) {
                list.add({"id": "-100", "value": addEmpty}, 0);
            };
            if ((!this.$noEmptyOption && value.emptyOption !== false) || value.emptyOption){
                var emptyOption = { id:"-1", value: value.emptyOption||"", $empty: true };
                list.add(emptyOption,0);
                }
            };
        if (value.value) this.setValue(node, value.value);
        select.render();
        webix.delay(select.resize, select);
    };

    webix.ui.datafilter.richFilt.render = function(master, config){
        if (!config.richselect){
            var d = webix.html.create("div", { "class" : "webix_richfilter" });
            var inputtype = (config.inputConfig) ? config.inputConfig.inputtype : undefined;
            var richconfig = {
                container:d,
                view: inputtype || this.inputtype,
                options:[]
                };
            var inputConfig = webix.extend( this.inputConfig||{}, config.inputConfig||{}, true );
            webix.extend(richconfig, inputConfig, true);
            if (config.separator) richconfig.separator = config.separator;
            if (config.suggest) richconfig.suggest = config.suggest;
            var richselect = webix.ui(richconfig);
            var pager_num = config.inputConfig.pager || 2; //номер элемента на вкладке, где находится пейджер
            richselect.attachEvent("onChange", function(){
                let cols = master.config.columns;
                cols.forEach(function(col){
                    if (col.id === richselect.config.column_name) {
                        col.header[1].height = master.getHeaderNode(col.id, 1).children[0].offsetHeight + 5;
                        master.refreshColumns();
                        }
                    })
                let pager_view = (config.inputConfig.scrollView) ? master.getParentView().getParentView().getChildViews()[pager_num].$scope.$$("__page")
                                                                 : master.getParentView().getChildViews()[pager_num].$scope.$$("__page");
                if (this._filter_timer) window.clearTimeout(this._filter_timer);
                this._filter_timer=window.setTimeout( () => {
                    let old_v = pager_view.getValue();
                    pager_view.setValue((+old_v ===0) ? '1' : "0");
                    pager_view.refresh();
                    },app.config.searchDelay);
                });
                
            config.richselect = richselect.config.id;
            };
        config.css = "webix_div_filter";
        return " ";
    }

    webix.ui.datafilter.cFilt = Object.create(webix.ui.datafilter.textFilter);
    webix.ui.datafilter.cFilt.on_key_down = function(e, node, value){
            var id = this._comp_id;
            var vi = webix.$$(id);
            if ((e.which || e.keyCode) == 9) return;
            if (!checkKey(e.keyCode)) return;
            if (this._filter_timer) window.clearTimeout(this._filter_timer);
            var pager_num = this._pager || 1; //номер элемента на вкладке, где находится пейджер
            var scrollView = this._scrollView;
            this._filter_timer=window.setTimeout(function(){
                let pager_view = (scrollView) ? vi.getParentView().getParentView().getChildViews()[pager_num].$scope.$$("__page")
                                                              : vi.getParentView().getChildViews()[pager_num].$scope.$$("__page");
                let old_v = pager_view.getValue();
                pager_view.setValue((+old_v ===0) ? '1' : "0");
                pager_view.refresh();
                },app.config.searchDelay);
            };
    webix.ui.datafilter.cFilt.refresh = function(master, node, value){
        node.component = master.config.id;
        master.registerFilter(node, value, this);
        node._comp_id = master.config.id;
        if (value.inputConfig) {
            node._pager = value.inputConfig.pager;
            node._scrollView = value.inputConfig.scrollView;
        };
        if (value.value && this.getValue(node) != value.value) this.setValue(node, value.value);
        node.onclick = webix.html.preventEvent;
        cEvent(node, "keydown", this.on_key_down);
    };

    webix.ui.datafilter.cFilt.render = function(master, config){
        if (this.init) this.init(config);
        config.css = "my_filter";
        return "<input "+(config.placeholder?('placeholder="'+config.placeholder+'" '):"")+"type='text'>";
    };

    webix.ui.datafilter.threeStCh = {
        getValue:function(){},
        setValue:function(){},
        getHelper:function(node, config){
            return {
                check:function(){ config.checked = true; config.indeter = false; node.repaint(); },
                checkInder: function(){ config.checked = false; config.indeter = true; node.repaint(); },
                uncheck:function(){ config.checked = false; config.indeter = false; node.repaint(); node.recount(0); },
                recount: function(new_value){node.recount(new_value); },
                getState: function() { return node.bState; },
            };
        },

        refresh:function(master, node, config){
            if (master.bState && master.bState ===1) node.button = "<button class='header-button header-button-highlited fa-" + config.inputConfig.buttonIcon + "' title='Показать выделенные'></button>";
            else node.button = "<button class='header-button fa-" + config.inputConfig.buttonIcon + "' title='Показать выделенные'></button>";
            node.counter = master.getHeaderNode(config.inputConfig.counter);
            node.storageName = master.config.name + "sel";

            node.repaint = function () {
                if (config.indeter) {
                    node.children[0].children[0].innerHTML = "<span class='threeSt-indeterminate'></span>" + node.button;
                } else {
                    node.children[0].children[0].innerHTML = "<input class='header-checkbox' type='checkbox' "+(config.checked?"checked='1'":"")+">" + node.button;
                }
            };

            node.recount = function(value){
                if (node.counter) node.counter.innerHTML= (value > 0) ? value : '';
            };

            node.onclick = function(e){
                if (node.disabled === 1) return false;
                if (e.target.className === "header-checkbox" || e.target.className === "threeSt-indeterminate") {
                    if (master.count() === 0) return false;
                    let child = node.children[0].children[0];
                    let params = webix.storage.session.get(node.storageName).s_pars
                    if (config.indeter || config.checked) {
                        config.checked = false;
                        config.indeter = false;
                        child.innerHTML = "<input class='header-checkbox' type='checkbox'>" + node.button;
                        // удаляем все позиции из хранилища
                        webix.storage.session.put(node.storageName, {"s_pars": params})
                    } else {
                        config.checked = true;
                        config.indeter = false;
                        child.innerHTML = "<input class='header-checkbox' type='checkbox' checked='1'>" + node.button;
                        // загружаем с сервера весь список id_spr'ов
                        // устанавливаем опцию all для хранилища
                        let url = (config.inputConfig.getIdMethod) ? master.$scope.app.config.r_url + "?" + config.inputConfig.getIdMethod : undefined;
                        if (url) {
                            node.disabled = 1;
                            request(url, params).then(function(data) {
                                node.disabled = 0;
                                data = checkVal(data, 'a');
                                if (data) {
                                    if (data.length > (config.inputConfig.maxCount || 2500)) {
                                        webix.message({'text': "Слишком много выделяем, давайте так не делать.", 'type': 'error', 'expire': 3000});
                                        config.checked = false; 
                                        config.indeter = true; 
                                        node.repaint();
                                    } else {
                                        var selected = webix.storage.session.get(node.storageName) || {};
                                        data.forEach((id_spr)=>{
                                            selected[id_spr] = true;
                                        })
                                        webix.storage.session.put(node.storageName, selected);
                                        node.recount(data.length);
                                    };
                                }
                            },
                            function() {
                                node.disabled = 0;
                            })
                        }
                    }
                    var column = master.getColumnConfig(config.columnId);
                    var checked = config.checked ? column.checkValue : column.uncheckValue;
                    master.data.each(function(obj){
                        obj[config.columnId] = checked;
                        master.callEvent("onCheck", [obj.id, config.columnId, checked, true]);
                        this.callEvent("onStoreUpdated", [obj.id, obj, "save"]);
                    });
                    master.refresh();
                } else if (e.target.className.search("header-button") != -1) {
                    if (e.target.className.search("header-button-highlited") != -1) {
                        e.target.classList.remove('header-button-highlited')
                        e.target.title = "Показать выделенные";
                        node.bState = 0;
                        master.bState = 0;
                    } else {
                        e.target.classList.add('header-button-highlited');
                        e.target.title = "Показать все";
                        node.bState = 1;
                        master.bState = 1;
                    }
                    node.button = e.target.outerHTML;
                    let pager = master.$scope.getRoot().getChildViews()[2].$scope.$$("__page");
                    let old_v = pager.getValue();
                    pager.setValue((+old_v === 0) ? '1' : "0");
                    pager.refresh()
                }
            };
        },

        render:function(master, config){
            let b = "<button class='header-button fa-" + config.inputConfig.buttonIcon + "' title='Показать выделенные'></button>";
            return  "<div style='width: 100%; height: 100%; display: flex; flex-direction: row; '>" +
            "<input class='header-checkbox' type='checkbox'>" +
            b + 
            "</div";
        }
    }

    // let delay = app.config.searchDelay;
    // setTimeout(get_refs, 0*delay, {"app": app, "type": "sync", "method": "getRoles", "store": "roles_dc"});
    // getRefs(app); 
}

export function setRefs(data) {
    if (data) {
        $$("strana_dc").clearAll();
        $$("strana_dc").parse(data.strana);
        $$("vendor_dc").clearAll();
        $$("vendor_dc").parse(data.vendor);
        $$("dv_dc").clearAll();
        $$("dv_dc").parse(data.dv);
        $$("nds_dc").clearAll();
        $$("nds_dc").parse(data.nds);
        $$("hran_dc").clearAll();
        $$("hran_dc").parse(data.hran);
        $$("sezon_dc").clearAll();
        $$("sezon_dc").parse(data.sezon);
        $$("group_dc").clearAll();
        $$("group_dc").parse(data.group);
        $$("allIs_dc").clearAll();
        $$("allIs_dc").parse(data.issue);
    };
}

export function getRefs(app, sync) {
    let url = app.config.r_url + "?getRefs"
    let params = {"user": app.config.user};
    if (sync) {
        let data = checkVal(request(url, params, !0).response, 's');
        setRefs(data);
    } else {
        request(url, params).then(function(data) {
            data = checkVal(data, 'a');
            setRefs(data);
        })
    }
}

export function clear_names_bar(th, on_error_text) {
    let vv = th.getRoot().getChildViews()[3].getChildViews();
    // let vv = th.getRoot().getChildViews()[1].getChildViews()[2].getChildViews()[0].getChildViews()[3].getChildViews();
    vv[0].clearAll() //clear datatable
    let n_item = {'_name': "", '_count': "", '_vendor': on_error_text || "", 'p_name': ""};
    if (th.$$("_local_add")) th.$$("_local_add").hide();
    th.$$("_local_left").hide();
    th.$$("_local_skip").hide();
    th.$$("_local_right").hide();
    th.$$('_local_link').hide();
    th.$$("_local_names_bar").parse(n_item);
    // th.$$("_local_names_bar").refresh();
    th.$$("_local_spr_search").setValue(''); //search bar
    let pager = vv[1]; //pager
    pager.getChildViews()[6].define('label', "Всего записей: 0");
    pager.getChildViews()[6].refresh();
    pager.$scope.$$("__page").config.manual = false;
    pager.$scope.$$("__page").setValue('1');
    pager.$scope.$$("__page").refresh();
    pager.getChildViews()[2].getChildViews()[2].define('label', '1'); //total_page
    pager.getChildViews()[2].getChildViews()[2].refresh();
}

export function get_prcs(th, id_vnd) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcs";
    let val_s = th.$$("_value_search").getValue();
    let params = {"user": user, "id_vnd": +id_vnd, "value_search": val_s};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            $$("prcs_dc").clearAll();
            if (data.length > 0) {
                $$("prcs_dc").parse(data);
            } else {
                clear_names_bar(th, "записей нет");
            }
        } else {
            webix.message('error');
        };
    })
}

export function get_prcs_source(th, source) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcsSou"
    let params = {"user": user, "source": +source};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            $$("prcs_dc").clearAll();
            if (data.length > 0) {
                $$("prcs_dc").parse(data);
            } else {
                clear_names_bar(th, "записей нет");
                }
        } else {
            webix.message('error');
            };
        })
    }

export function get_prcs_date(th,da) {
    let user = th.app.config.user;
    let url = th.app.config.r_url + "?getPrcsDate"
    let params = {"user": user, "date": da};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            $$("prcs_dc").clearAll();
            if (data.length > 0) {
                $$("prcs_dc").parse(data);
            } else {
                clear_names_bar(th, "записей нет");
                }
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

export function get_suppl(view, th, method) {
    let val_s;
    if (th.$$("_value_search") ) val_s = th.$$("_value_search").getValue();
    let user = th.app.config.user;
    let url = th.app.config.r_url + method
    let params = {"user": user, "value_search": val_s};
    request(url, params).then(function(data) {
        data = checkVal(data, 'a');
        if (data) {
            $$(view).getList().clearAll();
            $$(view).getList().parse(data);
            let fid = $$(view).getList().getFirstId();
            if (fid) {
                $$(view).setValue(fid);
            } else {
                $$(view).setValue()
            }
            $$(view).refresh();
        } else {
            clear_names_bar(th, 'записей нет');
        };
    if ($$(view).getList().count() < 1) {
        // если записей нет очищаем 
        clear_names_bar(th, 'записей нет');
    };
    })
}

export function delPrc(inp_data, th) {
    let cursor = prcs.getCursor();
    let data = $$("prcs_dc").data.order;
    let _c;
    data.forEach(function(item, i, data) {
        if (item === cursor) _c = i
    });
    if (_c === $$("prcs_dc").count()-1) _c = 0;
    else _c += 1
    let new_cursor = $$("prcs_dc").data.order[+_c]
    prcs.remove(cursor);
    if (prcs.count() < 1){
        (+$$("_link_by").getValue() === 2) ? get_suppl("_suppl", th, "?getDatesUnlnk") :
        (+$$("_link_by").getValue() === 3) ? get_suppl("_suppl", th, "?getSourceUnlnk") :
                                             get_suppl("_suppl", th, "?getSupplUnlnk");
    } else {
        prcs.setCursor(new_cursor);
        parse_unlinked_item(th);
        let ll = $$("_suppl").getList();
        let cc = $$("_suppl").getValue();
        let iti = ll.getItem(cc);
        iti.count = iti.count - 1;
        ll.updateItem(cc, iti);
        $$("_suppl").refresh();
    };

}

export function after_call(text, data, XmlHttpRequest) {
    if (XmlHttpRequest.status == 403) {
        deleteCookie("linker-app");
        location.href = (location.hostname === 'localhost') ? "http://localhost:8080" : "/linker/";
    };
}

export function request (url, params, mode) {
    var req = (mode === !0) ? webix.ajax().sync().headers({'Content-type': 'application/json'}).post(url, params, {error: after_call})
                        : webix.ajax().timeout(90000).headers({'Content-type': 'application/json'}).post(url, params, {error: after_call})
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
    setCookie(name, "", {
        'expires': -1, 'path': '/'
    })
}

export function checkSSE(view) {
    // проверяем есть ли SSE соединение
    let eventS = view.$scope.app.config.eventS;
    if (eventS && eventS.readyState===1) {
        return true
    }
    try {
        eventS.close()
    } catch (e) {
        };
    return false
}

export function spinIconEnable(view) {
    if (view.config.label.indexOf("fa-spin") === -1) {
        let l = view.config.label.replace("webix_icon", "webix_icon fa-spin");
        view.define({"label": l});
        view.refresh();
    }
}

export function spinIconDisable(view) {
    let l = view.config.label.replace(" fa-spin", "");
    view.define({"label": l});
    view.refresh();
    clearTimeout(view.config.qw);
}

export function setButtons(app, buttons_list) {
    buttons_list.forEach( (item) => {
        let butt;
        let width;
        if (app.config.expert) {
            width = item.config.eWidth;
            butt = item.config.oldLabel

        } else {
            width = item.config.sWidth;
            butt = "<span style='float: left; width:" + item.config.eWidth +"px'>" + item.config.oldLabel + "</span><span stile='width:";
            butt +=  + (item.config.sWidth-item.config.eWidth) +"px'>" + item.config.extLabel + "</span>";
        }
        item.define({width: width, label: butt});
        item.resize();
        item.refresh();
    })
}

export function DelEdIcons (can_delete) {
    let del_img = "<div class='webix_image image20x20', style='background-image:url(./addons/img/delete_20x20.svg);'</div>";
    let edit_img = "<div class='webix_image image20x20', style='background-image:url(./addons/img/edit_20x20.svg);'</div>";
    let del_but = "<div title='Удерживайте для удаления', class='webix_el_button posi'><button class='webix_img_btn_abs delete_button'>" + del_img + "</button> </div>";
    let edit_but = "<div class='webix_el_button posi'><button class='webix_img_btn_abs edit_button'>" + edit_img + "</button> </div>";
    return (can_delete) ? del_but + edit_but : edit_but;
}

export function refTemplate(obj, common, value) {
    let colSize = (obj.delete===false) ? "_1" : "_2";
    let col = "<div class='right_col"+ colSize + "'>" + value + "</div>";
    return "<div class = 'dt_hover'>" + common.itemIcon((obj.delete===false)?false:true) + col + "</div>";
}

export function recalcRowsRet(table) {
    // let q = table.$view.getElementsByClassName('webix_ss_body')[0];
    // setTimeout( () => {
        let q = table.$view.getElementsByClassName('webix_ss_center_scroll')[0];
        let totalHeight = q.clientHeight;
        console.log('total_h', totalHeight);
        let rows = Math.floor(totalHeight/table.config.rowHeight);
        console.log('r_rows', rows);
        if (rows == table.config.posPpage) return false;
        return rows
    // }, 0)
}

export function setRows(view){
    setTimeout( () => {
        let table = view.$$("__table");
        // let q = table.$view.getElementsByClassName('webix_ss_body')[0];
        let q = table.$view.getElementsByClassName('webix_ss_center_scroll')[0];
        let totalHeight = q.clientHeight;
        let rows = Math.floor(totalHeight/table.config.rowHeight);
        table.config.posPpage = rows;
    }, 10)
}


export function fillFilterOptions(app) {
    getRefs(app, true);
    var options = {"sezonList": [], "tgList": [], "ndsList": [], "hranList": [], "stranaList": [], "dvList":[], "vList": [], "tovGList": []};
    let tList;
    tList = $$("sezon_dc").data.getRange($$("sezon_dc").data.getFirstId(), $$("sezon_dc").data.getLastId());
    tList.forEach(function(it) {
        let tt = {'id': it.id, 'value': it.sezon};
        options.sezonList.push(tt);
    });
    tList = $$("hran_dc").data.getRange($$("hran_dc").data.getFirstId(), $$("hran_dc").data.getLastId());
    tList.forEach(function(it) {
        let tt = {'id': it.id, 'value': it.usloviya};
        options.hranList.push(tt);
    });
    tList = $$("nds_dc").data.getRange($$("nds_dc").data.getFirstId(), $$("nds_dc").data.getLastId());
    tList.forEach(function(it) {
        let tt = {'id': it.id, 'value': it.nds};
        options.ndsList.push(tt);
    });
    tList = $$("group_dc").data.getRange($$("group_dc").data.getFirstId(), $$("group_dc").data.getLastId());
    tList.forEach(function(it) {
        let tt = {'id': it.id, 'value': it.group};
        options.tgList.push(tt);
    });
    tList = singleRefReload(app, "getTgAll");
    tList.forEach(function(it) {
        let tt = {'id': it.id, 'value': it.c_tgroup};
        options.tovGList.push(tt);
    });    
    tList = $$("strana_dc").data.getRange($$("strana_dc").data.getFirstId(), $$("strana_dc").data.getLastId());
    tList.forEach(function(it) {
        let tt = {'id': it.id, 'value': it.c_strana};
        options.stranaList.push(tt);
    });
    tList = $$("dv_dc").data.getRange($$("dv_dc").data.getFirstId(), $$("dv_dc").data.getLastId());
    tList.forEach(function(it) {
        let tt = {'id': it.id, 'value': it.act_ingr};
        options.dvList.push(tt);
    });
    tList = $$("vendor_dc").data.getRange($$("vendor_dc").data.getFirstId(), $$("vendor_dc").data.getLastId());
    tList.forEach(function(it) {
        let tt = {'id': it.id, 'value': it.c_zavod};
        options.vList.push(tt);
    });
    return options
}

export function addScrollTooltip(view){
    var tooltip = document.createElement('div');
    tooltip.classList.add('scroll-tooltip');
    document.body.appendChild(tooltip);
    var thisView = view;
    var w = view.scroll.config.container;
    thisView.scroll.mouseIsDown = false;
    thisView.scroll.displayed = false;
    w.addEventListener('mousedown', function() {
        thisView.scroll.mouseIsDown = true;

        tooltip.style.top = w.scrollTop*(w.clientHeight-w.offsetTop+5)/w.scrollHeight + w.getBoundingClientRect().top + 5 + 'px';
        tooltip.textContent = getPNumber(thisView.scroll.config); //pos + '%';
        if (!thisView.scroll.displayed) {
            tooltip.style.display = 'block';
            thisView.scroll.displayed = true;
        }
    });
    w.addEventListener('mouseup', function() {
        thisView.scroll.mouseIsDown = false;
        if (thisView.scroll.displayed) {
            thisView.scroll.displayed = false;
            tooltip.style.display = 'none';
            thisView.scroll.callEvent('onScroll'); //////////////////
        }
    });
    w.addEventListener('scroll', function(e) {
        if (thisView.scroll.mouseIsDown) {
            tooltip.style.top = w.scrollTop*(w.clientHeight-w.offsetTop+5)/w.scrollHeight + w.getBoundingClientRect().top + 5 + 'px';
            tooltip.textContent = getPNumber(thisView.scroll.config); //pos + '%';
            if (!thisView.scroll.displayed) {
                tooltip.style.display = 'block';
                thisView.scroll.displayed = true;
            }
        }
    });
}

export function getPNumber(thisViewC) {
    let h = thisViewC.container.clientHeight;
    let sc = thisViewC.scrollPos;
    let pos = thisViewC.zoom * (sc + h * (sc/(1+sc)));
    let pageNumber = Math.ceil(pos/h - sc/(h+sc));
    if (pageNumber===0) pageNumber=1;
    return pageNumber;
}

export function setApplyButton (view, pagerNumber) {
    let applyButtion = $$(view.$$("__table").getColumnConfig('dt').header[1].suggest.body.id).getChildViews()[1].getChildViews()[1];
    applyButtion.setValue('Применить');
    applyButtion.define('click', function() {
        if (view._filter_timer) window.clearTimeout(view._filter_timer);
        view._filter_timer=window.setTimeout(function(){
            let pager = view.getRoot().getChildViews()[pagerNumber].$scope.$$("__page");
            let old_v = pager.getValue();
            pager.setValue((+old_v ===0) ? '1' : "0");
            pager.refresh();
        },webix.ui.datafilter.textWaitDelay);
        this.getParentView().getParentView().hide();
    });
}


export function save_storage (table, id_spr) {
    var selected = webix.storage.session.get(table.config.name+"sel") || {};
    selected[id_spr] = true;
    webix.storage.session.put(table.config.name+"sel", selected);
}

export function del_storage(table, id_spr) {
    var selected = webix.storage.session.get(table.config.name+"sel");
    // selected[id_spr] = false;
    delete(selected[id_spr]);
    webix.storage.session.put(table.config.name+"sel", selected);
}

export function toolTipAssign(view, prop_button) {
    let vi = view;
    let localStorage =  webix.storage.session.get(vi.$$("__table").config.name+"sel");
    delete(localStorage.s_pars);
    let count = 0;// = Object.keys(localStorage).length;
    Object.keys(localStorage).forEach((item)=>{
        if (localStorage[item]) count++;
    });
    if (count > 0) {
        if (vi.app.config.roles[vi.app.config.role].skipped) {
            prop_button.define({"tooltip": "Назначить свойства эталону. Выделенно " + count + " товаров."});
            prop_button.show();
        }
    } else {
        prop_button.define({"tooltip": "Назначить свойства эталону"});
        prop_button.hide();
    }
    prop_button.refresh();
}

export function getHeaderLength(header) {
    var testDiv = document.createElement("div");
    testDiv.innerHTML = header;
    // var el = document.getElementsByClassName('ms-logo-text')[0]
    document.body.insertBefore(testDiv, document.body.firstChild);
    // el.appendChild(testDiv);
    // console.dir(el);
    let h_length = testDiv.childNodes[1].offsetWidth;
    h_length += 75;
    testDiv.remove()
    return h_length
}

export function setMouseEvents(table) {
    table.getNode().onmouseover =  (ev) => {
        if ((ev.buttons===1 && 
             ev.target.getAttribute('role')==='gridcell' && 
             ev.target.children.length > 0 && 
             ev.target.firstChild.classList.contains('webix_table_checkbox')) ||
           ( ev.buttons===1 && ev.target.class === 'webix_table_checkbox' )
        ) {
            ev.target.classList.add('cell-highlighted');
            let row = ev.target.getAttribute('aria-rowindex');
            let item_id = table.data.order[row-1];
            let item = table.getItem(item_id);
            if (table.$scope.checked_id !== item.id) {
                table.$scope.checked_id = item.id;
                item.checkbox = (!item.checkbox) ? 1 : 0;
                table.updateItem(item.id, item); 
                table.callEvent('onCheck', [item.id, undefined, item.checkbox]);
            };
        }
    };
    table.getNode().onmouseout =  (ev) => {
        if ((ev.buttons===1 && 
             ev.target.getAttribute('role')==='gridcell' && 
             ev.target.children.length > 0 && 
             ev.target.firstChild.classList.contains('webix_table_checkbox')) ||
           ( ev.buttons===1 && ev.target.class === 'webix_table_checkbox' )
        ) {
            ev.target.classList.remove('cell-highlighted');
        }
    };
}

export function onKeyPressAction(th, code, e){
    if (e.code === "End" && e.shiftKey === true) {
        th.$scope.pager.$scope.$$("_lastPB").callEvent("onItemClick");
        th.$scope.setScroll();
        th.getNode().focus();
    } else if (e.code === "PageDown" && e.shiftKey === true) {
        th.$scope.pager.$scope.$$("_nextPB").callEvent("onItemClick");
        th.$scope.setScroll();
        th.getNode().focus();
    } else if (e.code === "PageUp" && e.shiftKey === true) {
        th.$scope.pager.$scope.$$("_prevPB").callEvent("onItemClick");
        th.$scope.setScroll();
        th.getNode().focus();
    } else if (e.code === "Home" && e.shiftKey === true) {
        th.$scope.pager.$scope.$$("_firstPB").callEvent("onItemClick");
        th.$scope.setScroll();
        th.getNode().focus();
    } else if (e.code === "PageDown" && th.getSelectedId() && th.data.getLastId().toString()===th.getSelectedId().id.toString()) {
        th.$scope.pager.$scope.$$("_nextPB").callEvent("onItemClick");
        th.$scope.setScroll();
        th.setRow = 'last';
    } else if (e.code === "PageUp" && th.getSelectedId() && th.data.getFirstId().toString()===th.getSelectedId().id.toString()) {
        th.$scope.pager.$scope.$$("_prevPB").callEvent("onItemClick");
        th.$scope.setScroll();
        th.getNode().focus();
        th.setRow = 'first';
    } else if (e.code === "ArrowDown" && th.getSelectedId() && th.data.getLastId().toString()===th.getSelectedId().id.toString()) {
        th.$scope.pager.$scope.$$("_nextPB").callEvent("onItemClick");
        th.$scope.setScroll();
        th.setRow = 'first';
    } else if (e.code === "ArrowUp" && th.getSelectedId() && th.data.getFirstId().toString()===th.getSelectedId().id.toString()) {
        th.$scope.pager.$scope.$$("_prevPB").callEvent("onItemClick");
        th.$scope.setScroll();
        th.setRow = 'last';
    } else if (13 === code) {
        if (th.getSelectedItem()) th.callEvent("onItemDblClick");
    } else if (e.code === "Space") {
        let item = th.getItem(th.getSelectedId().id);
        item.checkbox = (!item.checkbox) ? 1 : 0;
        th.updateItem(item.id, item); 
        th.callEvent('onCheck', [item.id, undefined, item.checkbox]);
    } else  {
    };

}