#coding: utf-8

import os
import sys
import glob
import json
import time
import uuid
import hashlib
import psycopg2
import io
import requests
import subprocess
import traceback
import sqlite3
import io
from multiprocessing.dummy import Pool as ThreadPool


import libs.xlsx as xlsx
from libs.connect import pg_local
import ms71lib

class API:
    """
    API class for http post access
    x_hash - API key
    """

    def __init__(self, log, w_path = '/ms71/data/merge3', p_path='/ms71/data/merge3/api-k', pg=False, production=False):
        self.production = production
        print('production', production)
        self.udp = sys.APPCONF["udpsock"]
        self.methods = []
        self.path = w_path
        self.p_path = p_path
        if not os.path.exists(self.path):
             os.makedirs(self.path, mode=0o777)
        if not os.path.exists(self.p_path):
             os.makedirs(self.p_path, mode=0o777)
        self._create_sqlite()
        self.log = log
        self.key = ""
        self.ch_key = ""
        #################################
        with open('api.key', 'r') as f_obj:
            self.key = f_obj.read().strip()
        with open("ch.key", "r") as f_obj:
            self.ch_key = f_obj.read().strip()
        self.ch_connect_params = {"uri":"https://online365.pro/ch/", "verbose":False, "api_key":self.ch_key}
        if pg:
            self._pg = True
            self.port = pg
        else:
            self._pg = True
            self.port = 5432
        self.log("POSTGRES STARTING on %s port" % self.port)
        self.db = pg_local(self.log, udp=sys.APPCONF["udpsock"], port = self.port, production=production)
        self.start = 1
        self.count = 20

    def _create_sqlite(self):
        sql_req = [
            'PRAGMA synchronous = OFF;',
            'PRAGMA journal_mode = OFF;',
            'PRAGMA page_size = 8192;',
            'create table if not exists tasks (task_id String Primary key, task_status String, task_reason String, dt Datetime DEFAULT CURRENT_TIMESTAMP);',
            'create table if not exists tasks_history (task_id String Primary key, task_text String);', 
            'create table if not exists tasks_complete (task_id String, task_params String PRIMARY KEY);'
            ]
        for sql in sql_req:
            self._sqlite(sql)
        #сделать проверку, может задачи уже выполнились из нашей базы
        sql_check = """update tasks set task_status='incomplete' where task_status='processing';"""
        self._sqlite(sql_check)
        sql_delete = """delete from tasks_complete where task_id in (select t.task_id from tasks t where t.task_status='complete');"""

        self._sqlite(sql_delete)

        self._sqlite_maintanance()

        return True

    def _sqlite_maintanance(self, basename='merge3.db3'):
        base_name = os.path.join(self.path, basename)
        con = sqlite3.connect(base_name, isolation_level=None)
        try:
            con.execute('vacuum')
        except:
            err = traceback.format_exc()
            self.log(f"SQLite_MAINTANANCE_Error: \n{err}")
        finally:
            try:
                con.close()
            except:
                err = traceback.format_exc()
                self.log(f"SQLite_CONN_CLOSE_Error: \n{err}")
        con = sqlite3.connect(base_name, isolation_level=None)
        cur = con.cursor()
        try:
            res = cur.execute("select count(*) from tasks_complete;")
            res = res.fetchall()[0][0]
            if int(res) == 0:
                cur.execute("drop table tasks_complete;")
        except:
            pass
        finally:
            try:
                cur.execute('create table if not exists tasks_complete (task_id String, task_params String PRIMARY KEY);')
            except:
                pass
            try:
                cur.close()
                con.close()
            except:
                pass                

        return True


    def _sqlite(self, sql, basename='merge3.db3'):
        base_name = os.path.join(self.path, basename)
        #autocommit
        answer = None
        con = sqlite3.connect(base_name, isolation_level=None)
        cur = con.cursor()
        #print(f'SQL:\n{sql}')
        try:
            answer = cur.execute(sql) 
        except:
            err = traceback.format_exc()
            self.log(f"SQLite SQL Error: \n{err}")
        else:
            answer = answer.fetchall()
        finally:
            try:
                cur.close()
                con.close()
            except:
                err = traceback.format_exc()
                self.log(f"SQLite conn close Error: \n{err}")
        #print(f'ANSWER:\n{answer}')
        return answer

    def _print(self, user=None, msg=None):
        udp_msg = [sys.APPCONF["log"].appname, 'change', user or '', msg or '', time.strftime("%Y-%m-%d %H:%M:%S")]
        print(str(json.dumps(udp_msg)), file=self.udp or sys.stdout)

    #####################################################
    def _make_msg(self, user, params):
        for i in params:
            self._print(user, i)

    def login(self, params=None, x_hash=None):
        from_sklad = params.get('from_sklad', False)
        user = params.get('user')
        p_hash = params.get('pass')
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            if not from_sklad:
                sql = f"""select r."USER", r.PASSWD, r.ID_ROLE, r.EXPERT FROM USERS r where lower(r."USER") = lower(%s)"""
                opt = (user,)
                res = self.db.request({"sql": sql, "options": opt})
                if len(res) > 0:
                    md = hashlib.md5()
                    md.update(res[0][1].encode())
                    if md.hexdigest() == p_hash:
                        # k_list = glob.glob(os.path.join(self.p_path, '*'))
                        # for f_name in k_list:
                        #     with open(f_name, 'rb') as f_obj:
                        #         fuser = f_obj.read().decode().strip()
                        #     if fuser.lower() == user.lower():
                        #         os.remove(f_name)
                        #         #break
                        a_key = uuid.uuid4().hex
                        f_name = os.path.join(self.p_path, a_key)
                        with open(f_name, 'wb') as f_obj:
                            f_obj.write(res[0][0].encode())
                        ret = {"result": True, "ret_val": {"key": a_key, "role": str(res[0][2]), "expert": str(res[0][3]), "user":str(res[0][0])}}
            else:
                a_key = uuid.uuid4().hex
                f_name = os.path.join(self.p_path, a_key)
                with open(f_name, 'wb') as f_obj:
                    f_obj.write(user.encode())
                ret = {"result": True, "ret_val": {"key": a_key, "user":user}}
        return json.dumps(ret, ensure_ascii=False)

    def getHistory(self, params=None, x_hash=None):
        if self._check(x_hash):
            #user = params.get('user')
            id_spr = params.get("id_spr")
            sql = """select user, payload, dt from udp_logs.logs where application='merge3' and type='change' %s FORMAT TabSeparatedRaw;"""
            ins = ''
            if id_spr:
                ins = f"""and payload like '%\"ref_id": "{str(id_spr)}"%\'"""
            sql = sql % ins
            server = ms71lib.ServerProxy(**self.ch_connect_params)
            request = server("request")
            result = request(sql.encode())
            server('close')
            ret_val = []
            ii = set()
            vn = []
            vendors = {}
            companies = {}
            for row in result:
                row = row.decode()
                row = row.split("\t")
                payload = row[1]
                payload = payload.replace('True', '"True"')
                pl = json.loads(payload)
                inns = pl.get('inn', -1)
                vnd = pl.get('scode')
                if inns == -1:
                    continue
                for i in inns:
                    ii.add(i)
                vn.append(vnd)
                hard = pl.get("abso", "")
                if hard == "True":
                    hard = True
                r = {
                    "user": row[0],
                    "remove": pl.get('remove', ""),
                    "expires": pl.get("expires", ""),
                    "hard": hard,
                    "inns": inns,
                    "c_inns": [],
                    "id_vnd": vnd,
                    "c_vnd": "",
                    "dt": row[2]
                }
                ret_val.append(r)
            ii = list(ii)
            sql_inns = f"""select inn, c_inn from companies where inn in ({','.join(["'%s'"%i for i in ii])});"""
            sql_vnd = f"""select id_vnd, c_vnd, merge3 from vnd where id_vnd in ({','.join(["%s"%i for i in vn])});"""
            p_list = [{'sql': sql_inns, 'opt': ()}, {'sql': sql_vnd, 'opt': ()}]
            pool = ThreadPool(2)
            result_inns, result_vnd = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            for row in result_vnd:
                vendors[int(row[0])] = row[1]
            for row in result_inns:
                companies[int(row[0])] = row[1]
            for row in ret_val:
                inns = row['inns']
                c_inns = []
                for inn in inns:
                    c_inns.append(companies.get(int(inn)))
                row["c_inns"] = c_inns
                row["c_vnd"] = vendors.get(int(row["id_vnd"]))
            ret = {"result": True, "ret_val": ret_val}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setExit(self, params=None, x_hash=None):
        #user = params.get('user')
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            f_name =(os.path.join(self.p_path, x_hash)) 
            try:
                if 'x_login' not in f_name:
                    os.remove(f_name)
            except:
                pass
                ret = {"result": True, "ret_val": "logout"}
        return json.dumps(ret, ensure_ascii=False)

    def getVersion(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = f"""select r.ID_ROLE FROM USERS r where lower(r."USER") = lower(%s)"""
            opt = (user,)
            res = self.db.request({"sql": sql, "options": opt})
            adm = False
            if res[0][0] in (10, 34):
                adm = True

            prod = {'version': self.log.version, 'prod': self.db.production, 'adm': adm}
            ret = {"result": True, "ret_val": prod}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)
    
    def getCompanies(self, params=None, x_hash=None):
        if self._check(x_hash):
            #user = params.get('user')
            sql = """select inn, c_inn, id from companies order by c_inn;"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "inn": str(row[0]),
                    "c_inn": row[1],
                    "id": row[2]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setUsersInn(self, params=None, x_hash=None):
        if self._check(x_hash):
            #user = params.get('user')
            inn_user = params.get("inn_user")
            user_id = params.get("edit_user")
            ins = []
            if user_id:
                sql = """delete from users_inn where user_id = %s;"""
                self.db.execute({"sql": sql, "options": (user_id,)})
                for item in inn_user:
                    ins.append([int(item.get('inn')), user_id])
                if len(ins) > 0:
                    sql = """insert into users_inn (inn, user_id) values (%s, %s);"""
                    self.db.executemany({"sql": sql, "options": ins})
            ret = {"result": True, "ret_val": "OK"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getUserInn(self, params=None, x_hash=None):
        if self._check(x_hash):
            #user = params.get('user')
            user_id = params.get("user_id")
            inn_all = []
            inn_user = []
            if user_id:
                sql_user = """select uui.inn, cc.c_inn from users uu
    join users_inn uui on uui.user_id = uu.id
    join companies cc on cast(uui.inn as text) = cc.inn
    where uu.id = %s order by cc.c_inn;"""
                opt = (user_id, )
                sql_all = """select inn, c_inn from companies order by c_inn; """
                opt_all = ()
                p_list = [{'sql': sql_user, 'opt': opt}, {'sql': sql_all, 'opt': opt_all}]
                pool = ThreadPool(2)
                result_user, result_all = pool.map(self._make_sql, p_list)
                pool.close()
                pool.join()
                for row in result_user:
                    r = {
                        "inn": row[0],
                        "c_inn": row[1]
                    }
                    inn_user.append(r)
                for row in result_all:
                    r = {
                        "inn": row[0],
                        "c_inn": row[1]
                    }
                    inn_all.append(r)
            ret = {"result": True, "ret_val": {'all': inn_all, 'user': inn_user}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getUsers(self, params=None, x_hash=None):
        if self._check(x_hash):
            #user = params.get('user')
            sql = """select id, "USER" from users order by "USER";"""
            opt = ()
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "value": row[1],
                    "id": row[0]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def setCompanies(self, params=None, x_hash=None):
        if self._check(x_hash):
            ret = False
            #user = params.get('user')
            deleted = params.get("deleted")
            changed = params.get("changed")
            added = params.get("added")
            if deleted:
                d = []
                for i in deleted:
                    item_id = i.get('id')
                    if item_id:
                        d.append(int(item_id))
                if d:
                    sql = f"""delete from companies where id in ({','.join([str(j) for j in d])})"""
                    result = self.db.execute({"sql": sql, "options": ()})
                    if result:
                        pass
                    ret = True
            if changed:
                sql_template = """update companies set c_inn = %s where id = %s;"""
                inserts = [] 
                for item in changed:
                    inserts.append([item.get("c_inn"), item.get("id")])
                if len(inserts) > 0:
                    result = self.db.executemany({"sql": sql_template, "options": inserts})
                    ret = True
            if added:
                sql_template = """insert into companies (inn, c_inn) values (%s, %s);"""
                inserts = [] 
                for item in added:
                    inserts.append([item.get("inn"), item.get("c_inn")])
                if len(inserts) > 0:
                    result = self.db.executemany({"sql": sql_template, "options": inserts})
                    ret = True
            ret = {"result": True, "ret_val": "OK"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)


    def getInn(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            sql = """select ui.inn, co.c_inn from users us
join users_inn ui on us.id = ui.user_id
join companies co on co.inn = cast(ui.inn as text)
where us."USER" = %s;"""
            opt = (user,)
            _return = []
            result = self.db.request({"sql": sql, "options": opt})
            for row in result:
                r = {
                    "inn": str(row[0]),
                    "w": 1,
                    "c_v": row[1]
                }
                _return.append(r)
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _create_ins_tasks(self, id_spr):
        params = []
        if id_spr:
            rpc = ms71lib.ServerProxy("https://sklad71.org/apps/mrksrv/uri/RPC2", api_key=self.key)
            plxdata = rpc.plx('reference_links_search', ref_id=str(id_spr))[0]
            rpc('close')()
            inserts = {}
            for pd in plxdata:
                index_id = ':%:'.join([str(pd[1]), str(id_spr)])
                if inserts.get(index_id):
                    #апдейтим запись
                    inserts[index_id].append(str(pd[0]))
                else:
                    inserts[index_id] = [str(pd[0]),]
            for item in inserts:
                vnd, id_spr = item.split(':%:')
                r = {'inn': inserts.get(item), 'ref_id': str(id_spr), 
                        'scode': str(vnd), "remove": 1
                }
                params.append(r)
        return params

    def delVndAll(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            inns = params.get('inn')
            if inns and not isinstance(inns, list):
                inns = [inns, ]
            for i in range(len(inns)):
                inns[i] = str(inns[i])
            id_spr = params.get('id_spr')
            params = self._create_ins_tasks(id_spr)
            _return = []
            if len(params) > 0:
                self._make_msg(user, params)
                while params:
                    pr = []
                    for i in range(4):
                        try:
                            p = params.pop(0)
                        except:
                            break
                        else:
                            pr.append(p)
                    pool = ThreadPool(len(pr))
                    results = pool.map(self._set_vnd, pr)
                    pool.close()
                    pool.join()
                    for i, result in enumerate(results):
                        _return.append({"params": pr[i], "result": result})
                        self.log(f"\nQ: {pr[i]}\nA: {result}")
            ret = {"result": True, "ret_val": "OK"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def taskBegin(self, params=None, x_hash=None):
        ret = {"result": False, "reason": "insert_error"}
        user = params.get('user')
        if user:
            task_id = uuid.uuid4().hex
            task_text = json.dumps(params)
            sql_task = f"""insert into tasks (task_id, task_status, task_reason) values ('{task_id}', 'incomplete', 'new_task');"""
            sql_history = f"""insert into tasks_history (task_id, task_text) values ('{task_id}', '{task_text}'); """
            answer = self._sqlite(sql_task)
            if answer != None:
                a1 = self._sqlite(sql_history)
            if a1 != None:
                ret = {"result": True, "id": task_id, "reason": "task_inserted"}
        else:
            ret = {"result": False, "reason": "user_must_be_specified"}
        return json.dumps(ret)

    def _sqlite_many(self, sql, opt, basename='merge3.db3'):
        base_name = os.path.join(self.path, basename)
        #autocommit
        answer = None
        con = sqlite3.connect(base_name, isolation_level=None)
        cur = con.cursor()
        #print(f'SQL:\n{sql}')
        for i in range(5):
            try:
                answer = cur.executemany(sql, opt)
                break
            except:
                err = traceback.format_exc()
                self.log(f"SQLite_SQL_Error_Many: \n{err}")
                time.sleep(0.1* (1 + i))
            finally:
                try:
                    cur.close()
                    con.close()
                except:
                    err = traceback.format_exc()
                    self.log(f"SQLite_con_close_Error: \n{err}")
        return answer

    def _plx_execute(self, params):
        sql = params.get('sql')
        options = params.get('options')
        alias = params.get('alias', 'plx')
        rpc = ms71lib.ServerProxy(f"https://sklad71.org/apps/fdbsrv@plx-db/uri/RPC2", api_key=self.key)
        if options:
            ret = rpc.fdb.execute(alias, sql, (options,))
        else:
            ret = rpc.fdb.execute(alias, sql)
        rpc('close')()
        return ret

    def _plx_execute_many(self, params):
        sql = params.get('sql')
        options = params.get('options')
        alias = params.get('alias', 'plx')
        ret = True
        rpc = ms71lib.ServerProxy(f"https://sklad71.org/apps/fdbsrv@plx-db/uri/RPC2", api_key=self.key)
        ret = rpc.fdb.executemany(alias, sql, options)
        rpc('close')()
        # if self.c == 3:
        #     print('writing')
        #     with open('options.txt', 'w') as f_:
        #         f_.write('\n'.join([str(q) for q in options]))
        #     with open('sql.txt', 'w') as f_:
        #         f_.write(sql)
        return ret

    def _get_suppl_id(self, vnd):
        vnds = None
        if not isinstance(vnd, list):
            vnd = [vnd, ]
        vnd_id = []
        for i in range(len(vnd)):
            vnd[i] = str(vnd[i])
        if len(vnd) == 1:
            sql = f"""select code, id from app_supplier where code = '{vnd[0]}'"""
        else:
            sql_select_suppl = """select code, id from app_supplier where code in %s"""
            sql = sql_select_suppl % str(tuple(vnd))
        for i in range(5):
            try:
                vnds = self._plx_execute({"alias": "plx", "sql": sql})
            except:
                sl = 0.25*(i+1)
                self.log(f"""CON_ERROR_IN_SUPPL_ORG_ID_TEXT:\n{traceback.format_exc()}""")
                self.log(f"""CON_ERROR_IN_GET_SUPPL_ID_SLEEP_FOR: {sl} secs.""")
                time.sleep(sl)
            else:
                break
        if not vnds:
            vnds = [["-1", -1]]
        vnds_dict = {}
        for row in vnds:
            vnds_dict[row[0]] = row[1]
        for v in vnd:
            c_id = vnds_dict.get(v, -1)
            vnd_id.append(c_id)
        return vnd_id

    def _get_org_id(self, inn):
        inns = None
        if not isinstance(inn, list):
            inn = [inn, ]
        inn_id = []
        for i in range(len(inn)):
            inn[i] = str(inn[i])
        if len(inn) == 1:
            sql = f"""select inn, id from app_org where inn = '{inn[0]}';"""
        else:
            sql_select_orgs = """select inn, id from app_org where inn in %s;"""
            sql = sql_select_orgs % str(tuple(inn))
        for i in range(5):
            try:
                inns = self._plx_execute({"alias": "plx", "sql": sql})
            except:
                sl = 0.25*(i+1)
                self.log(f"""CON_ERROR_IN_GET_ORG_ID_TEXT:\n{traceback.format_exc()}""")
                self.log(f"""CON_ERROR_IN_GET_ORG_ID_SLEEP_FOR: {sl} secs.""")
                time.sleep(sl)
            else:
                break
        if not inns:
            inns = [["-1", -1]]
        inns_dict = {}
        for row in inns:
            inns_dict[row[0]] = row[1]
        for v in inn:
            c_id = inns_dict.get(v, -1)
            inn_id.append(c_id)
        return inn_id


    def _getHash(self, string):
        md = hashlib.md5()
        md.update(string.encode())
        return md.hexdigest()

    def _form_remove(self, vnds, inns, id_sprs, test=False):
        sql_3 = """delete from app_referencelink where org_id = %s and supplier_id = %s and ref_id = %s;"""
        sql_2 = """delete from app_referencelink where org_id = %s and ref_id = %s;"""
        inns = self._get_org_id(inns)
        if isinstance(id_sprs, list):
            for i in range(len(id_sprs)):
                id_sprs[i] = str(id_sprs[i])
        else:
            id_sprs = [str(id_sprs), ]
        task_datas = []
        if vnds:
            vnds = self._get_suppl_id(vnds)
            for v in vnds:
                for i in inns:
                    for s in id_sprs:
                        if v != -1 and i != -1  and s !=-1:
                            task_datas.append({"s": sql_3, "o": (i, v, s)})
        else:
            for i in inns:
                for s in id_sprs:
                    if i != -1  and s !=-1:
                        task_datas.append({"s": sql_2, "o": (i, s)})
        return task_datas

    def _form_insert(self, vnds, inns, id_sprs, expires, hard, user, test=False):
        if not vnds:
            vnds = -1
        sql_ins_e = """insert into app_referencelink (created, updated, org_id, supplier_id, ref_id, expires, abso) values
(current_timestamp, current_timestamp, %s, %s, %s, %s, %s)
on conflict (org_id, supplier_id, ref_id) do update
set (updated, org_id, supplier_id, ref_id, expires, abso) = (current_timestamp, %s, %s, %s, %s, %s);"""
        sql_ins = """insert into app_referencelink (created, updated, org_id, supplier_id, ref_id, abso) values
(current_timestamp, current_timestamp, %s, %s, %s, %s)
on conflict (org_id, supplier_id, ref_id) do update
set (updated, org_id, supplier_id, ref_id, expires, abso) = (current_timestamp, %s, %s, %s, %s);"""
        inns = self._get_org_id(inns)
        if isinstance(id_sprs, list):
            for i in range(len(id_sprs)):
                id_sprs[i] = str(id_sprs[i])
        else:
            id_sprs = [str(id_sprs), ]
        task_datas = []
        vnds = self._get_suppl_id(vnds)
        if str(hard) == '1' or hard == True:
            hard = True
        else:
            hard = False
        if expires:            
            for v in vnds:
                for i in inns:
                    for s in id_sprs:
                        if v != -1 and i != -1 and s !=-1:
                            opt = (i, v, s, expires, hard)
                            task_datas.append({"s": sql_ins_e, "o": opt + opt})
        else:
            for v in vnds:
                for i in inns:
                    for s in id_sprs:
                        if v != -1 and i != -1 and s !=-1:
                            opt = (i, v, s, hard)
                            task_datas.append({"s": sql_ins, "o": opt + opt})
        return task_datas

    def _taskProcess(self):

        sql_check = """update tasks set task_status='incomplete' where task_status='processing';"""
        self._sqlite(sql_check)
        sql_delete = """delete from tasks_complete where task_id in (select t.task_id from tasks t where t.task_status='complete');"""
        self._sqlite(sql_delete)

        sql_task_upd_status = """update tasks set task_status = '%s', task_reason = '%s' where task_id = '%s';"""
        sql_tasks = """select task_id from tasks where task_status = 'incomplete';"""
        #########################
        # sql_tasks = """select task_id from tasks where task_id = 'd27f836f4e6142f99afb75f45683ebfa';"""
        sql_get_task = "select task_text from tasks_history where task_id = '%s';"
        answer = self._sqlite(sql_tasks)
        if answer:
            tasks = []
            for a in answer:
                tasks.append(str(a[0]))
            if len(tasks) > 0:
                # if len(tasks) == 1:
                #     tasks_ins = f"('{tasks[0]}')"
                # else:
                #     tasks_ins = str(tuple(tasks))
                # sql_tasks_upd = f"""update tasks set task_status = 'processing' where task_id in {tasks_ins};"""
                # self._sqlite(sql_tasks_upd)
                for task in tasks: 
                    c = 0
                    sql_tasks_upd = f"""update tasks set task_status = 'processing' where task_id = '{task}';"""
                    self._sqlite(sql_tasks_upd)
                    params = self._sqlite(sql_get_task % task)
                    if params:
                        try:
                            params = json.loads(params[0][0])
                        except:
                            self.log(f"""TASK_TEXT_CONVERT_ERROR: task_id: {task}\n{traceback.format_exc()}""")
                            self._sqlite(sql_task_upd_status % ('incomplete', 'cannot_convert_task_text', task))
                            continue
                    else:
                        self.log(f"""TASK_TEXT_READ_ERROR: task_id: {task}\n{traceback.format_exc()}""")
                        self._sqlite(sql_task_upd_status % ('incomplete', 'cannot_read_task_text', task))
                        continue
                    vnds = params.get('vnds')#[0]###########
                    inns = params.get('inn')
                    if not inns:
                        inns = -1
                    id_sprs = params.get('id_spr')#[0]###########
                    if not id_sprs:
                        id_sprs = -1
                    remove = params.get('remove')
                    expires = params.get('expires')
                    hard = params.get('hard', False)
                    user = params.get('user')
                    test = params.get('test', False)
                    if remove:
                        task_datas = self._form_remove(vnds, inns, id_sprs, test)
                    else:
                        task_datas = self._form_insert(vnds, inns, id_sprs, expires, hard, user, test)

                    results_task = []
                    params_log = []
                    #выполняем задачи последовательно пулами и execute_many по 1000 запросов, в пуле не больше 4 задач
                    br = False
                    while task_datas:
                        #пул из 4 тредов
                        pr = []
                        for j in range(4):
                            sql = None
                            pr_i = []
                            #1000 подзапросов
                            for i in range(1000):
                                try:
                                    p = task_datas.pop(0)
                                except:
                                    break
                                else:
                                    c += 1
                                    if c % 1000 == 0:
                                        self.log(f"PROCESSING:{task}, DONE: {c}")
                                    # проверяем в базе есть ли этот параметр, если есть - берем следующий, если нет - добавляем
                                    check_str = self._getHash(json.dumps(p))
                                    #sql_check = f"""select count(*) from tasks_complete where task_id ='{task}' and task_params='{check_str}' """
                                    sql_check = f"""select exists (select task_id from tasks_complete where task_id ='{task}' and task_params='{check_str}')"""
                                    count = self._sqlite(sql_check)
                                    count = count[0][0]
                                    if int(count) == 1:
                                        continue
                                    ppp = p.get('o')
                                    if not ppp:
                                        continue
                                    pr_i.append(ppp)
                                    sql = p.get('s')
                            if len(pr_i) < 1:
                                continue
                            pr_ins = {"sql": sql, "options": pr_i}
                            ############
                            # check_str = self._getHash(json.dumps(pr_ins))
                            # #sql_check = f"""select count(*) from tasks_complete where task_id ='{task}' and task_params='{check_str}' """
                            # sql_check = f"""select exists (select task_id from tasks_complete where task_id ='{task}' and task_params='{check_str}')"""
                            # count = self._sqlite(sql_check)
                            # count = count[0][0]
                            # if int(count) == 1:
                            #     continue
                            #############
                            pr.append(pr_ins)
                        if len(pr) < 1:
                            continue
                        ok = False

                        #5 попыток
                        for t in range(5):
                            try:
                                # выполняем задачи в пуле
                                pool = ThreadPool(len(pr))
                                results = pool.map(self._plx_execute_many, pr)
                                pool.close()
                                pool.join()
                            except:
                                sl = 0.25*(t+1)
                                self.log(f"""TASK_INCOMPLETED_IN_POOL_ERROR_TEXT:\n{traceback.format_exc()}""")
                                self.log(f"""TASK_INCOMPLETED_IN_POOL_SLEEP_FOR: {sl} secs.""")
                                time.sleep(sl)
                            else:
                                ok = True
                                break
                            finally:
                                try: pool.close()
                                except: pass
                                try: pool.join()
                                except: pass
                        if not ok:
                            self.log(f"""TASK_INCOMPLETED_IN_POOL: {task} after 5 attepts""")
                            self._sqlite(sql_task_upd_status % ('incomplete', 'server_error', task))
                            br=True
                            break
                        for i, result in enumerate(results):
                            # chs = self._getHash(json.dumps(pr[i]))
                            # opts = [task, chs]

                            sql_i = pr[i].get('sql')
                            opt_i = pr[i].get('options')
                            opts = []
                            for j in opt_i:
                                r = {'s': sql_i, 'o':j}
                                chs = self._getHash(json.dumps(r))
                                opts.append((task, chs))
                                results_task.append([r, result])
                                # print(r, chs, sep='\t')
                            if len(opts) > 0:
                                self._sqlite_many("insert into tasks_complete (task_id, task_params) values (?, ?)", opts)
                            # for j in opt_i:
                            #     r = {'s': sql_i, 'o':j}
                            #     results_task.append([r, result])
                    if br:
                        continue
                    complete = True
                    for r in results_task:
                        if str(r[1]) != 'True' and str(r[1]) != 'None':
                            complete = False
                        else:
                            params_log.append(r[0])
                    self._make_msg(user, params_log)
                    if complete:
                        #задача выполнена
                        self.log(f"""TASK_DONE: {task}""")
                        self._sqlite(sql_task_upd_status % ('done', 'task_success', task))
                        self._sqlite(f"""delete from tasks_complete where task_id = '{task}';""")
                        self._sqlite_maintanance()
                    else:
                        #задача не выполнена
                        self.log(f"""TASK_INCOMPLETED: {task}""")
                        self._sqlite(sql_task_upd_status % ('incomplete', 'server_error', task))



    def _taskProcess_old(self):
        sql_task_upd_status = """update tasks set task_status = '%s', task_reason = '%s' where task_id = '%s';"""
        sql_tasks = """select task_id from tasks where task_status = 'incomplete';"""
        sql_get_task = "select task_text from tasks_history where task_id = '%s';"
        answer = self._sqlite(sql_tasks)
        if answer:
            tasks = []
            for a in answer:
                tasks.append(str(a[0]))
            if len(tasks) > 0:
                if len(tasks) == 1:
                    tasks_ins = f"('{tasks[0]}')"
                else:
                    tasks_ins = str(tuple(tasks))
                sql_tasks_upd = f"""update tasks set task_status = 'processing' where task_id in {tasks_ins};"""
                self._sqlite(sql_tasks_upd)
                for task in tasks:
                    params = self._sqlite(sql_get_task % task)
                    if params:
                        try:
                            params = json.loads(params[0][0])
                        except:
                            self.log(f"""TASK_TEXT_CONVERT_ERROR: task_id: {task}\n{traceback.format_exc()}""")
                            self._sqlite(sql_task_upd_status % ('incomplete', 'cannot_convert_task_text', task))
                            continue
                    else:
                        self.log(f"""TASK_TEXT_READ_ERROR: task_id: {task}\n{traceback.format_exc()}""")
                        self._sqlite(sql_task_upd_status % ('incomplete', 'cannot_read_task_text', task))
                        continue
                    vnds = params.get('vnds')
                    inns = params.get('inn')
                    id_sprs = params.get('id_spr')
                    remove = params.get('remove')
                    expires = params.get('expires')
                    hard = params.get('hard', False)
                    user = params.get('user')
                    test = params.get('test', False)
                    #формируем задачи разбивая ее на группы по поставщику
                    if isinstance(inns, list):
                        for i in range(len(inns)):
                            inns[i] = str(inns[i])
                    else:
                        inns = str(inns)
                    if not isinstance(vnds, list):
                        vnds = [str(vnds), ]
                    if isinstance(id_sprs, list):
                        for i in range(len(id_sprs)):
                            id_sprs[i] = str(id_sprs[i])
                    else:
                        id_sprs = [str(id_sprs), ]
                    task_datas = []
                    results_task = []
                    params_log = []

                    for id_spr in id_sprs:
                        for vnd in vnds:
                            r = {'inn': inns, 'ref_id': id_spr, 'scode': str(vnd)}
                            if str(remove) == '1':
                                r['remove'] = 1
                            if expires and not remove: 
                                r['expires'] = expires
                            if str(hard) == '1' and not remove:
                                r['abso'] = True    
                            task_datas.append(r)
                        
                    #выполняем задачи последовательно пулами, в пуле не больше 4 задач
                    br = False
                    while task_datas:
                        pr = []
                        for i in range(10):
                            try:
                                p = task_datas.pop(0)
                            except:
                                break
                            else:
                                #проверяем в базе есть ли этот параметр, если есть - берем следующий, если нет - добавляем
                                check_str = json.dumps(p)
                                sql_check = f"""select count(*) from tasks_complete  where task_id ='{task}' and task_params='{check_str}' """
                                count = self._sqlite(sql_check)
                                # self.log(f"""COU_ANSWER: {count}.""")
                                count = count[0][0]
                                if int(count) == 1:
                                    continue
                                if test:    
                                    pr.append((p, str(p)))
                                else:
                                    pr.append(p)
                        if len(pr) < 1:
                            continue
                        ok = False
                        for t in range(5):
                            try:
                                pool = ThreadPool(len(pr))
                                results = pool.map(self._set_vnd, pr)
                                pool.close()
                                pool.join()
                            except:
                                sl = 0.3*(t+1)
                                self.log(f"""TASK_INCOMPLETED_IN_POOL_ERROR_TEXT:\n{traceback.format_exc()}""")
                                self.log(f"""TASK_INCOMPLETED_IN_POOL_SLEEP_FOR: {sl} secs.""")
                                time.sleep(sl)
                            else:
                                ok = True
                                break
                            finally:
                                try: pool.close()
                                except: pass
                                try: pool.join()
                                except: pass
                        if not ok:
                            self.log(f"""TASK_INCOMPLETED_IN_POOL: {task} after 5 attepts""")
                            self._sqlite(sql_task_upd_status % ('incomplete', 'server_error', task))
                            br=True
                            break

                        for i, result in enumerate(results):
                            results_task.append([pr[i], result])
                            self.log(f"\nQ: {pr[i]}\nA: {result}")
                            sql_compl = f"""insert into tasks_complete (task_id, task_params) values ('{task}', '{json.dumps(pr[i])}');"""
                            self._sqlite(sql_compl)
                    if br:
                        continue
                    complete = True
                    for r in results_task:
                        if str(r[1]) != 'True' and str(r[1]) != 'None':
                            complete = False
                        else:
                            params_log.append(r[0])
                    self._make_msg(user, params_log)
                    if complete:
                        #задача выполнена
                        self.log(f"""TASK_DONE: {task}""")
                        self._sqlite(sql_task_upd_status % ('done', 'task_success', task))
                        self._sqlite(f"""delete from tasks_complete where task_id = '{task}';""")
                    else:
                        #задача не выполнена
                        self.log(f"""TASK_INCOMPLETED: {task}""")
                        self._sqlite(sql_task_upd_status % ('incomplete', 'server_error', task))

    def taskStatus(self, params=None, x_hash=None):
        task_id = params.get('id')
        if task_id:
            sql = f"""select task_id, task_status, task_reason from tasks where task_id = '{task_id}' """
            sql_result = self._sqlite(sql)
            status = None
            reason = None
            if sql_result:
                status = sql_result[0][1]
                reason = sql_result[0][2]
                ret = {"result": True, "id": task_id, "status": status, "reason": reason}
            else:
                ret = {"result": False, "id": task_id, "reason": "no_task"}
        else:
            ret = {"result": False, "reason": "no_id"}
        return json.dumps(ret)


    def taskComplete(self, params=None, x_hash=None):
        task_id = params.get('id')
        if task_id:
            sql_check = f"""select 
CASE
	WHEN EXISTS (select task_id from tasks where task_id = '{task_id}' and task_status='done') THEN 1
	WHEN EXISTS (select task_id from tasks where task_id = '{task_id}' and task_status!='done') THEN 2
	ELSE 0
END;"""
            #c = self._sqlite(f"select task_id from tasks where task_id = '{task_id}' and task_status='done';")
            c = self._sqlite(sql_check)
            if c and int(c[0][0])==1:
                sqls = [f"""delete from tasks where task_id = '{task_id}'""", 
                        f"""delete from tasks_history where task_id = '{task_id}'"""
                        ]
                for sql in sqls:
                    self._sqlite(sql)
                ret = {"result": True, "id": task_id, "reason": "complete"}
            elif c and int(c[0][0])==2:
                ret = {"result": False, "id": task_id, "reason": "task_incomplete"}
            else:
                ret = {"result": True, "id": task_id, "reason": "complete"}
        else:
            ret = {"result": False, "reason": "no_id"}
        return json.dumps(ret)
        

    def setVnd(self, params=None, x_hash=None):
        if self._check(x_hash):
            user = params.get('user')
            datas = params.get('datas')
            remove = params.get('remove')
            inserts = {}
            for item in datas:
                vnd = item.get('vnd')
                inn = item.get('inn')
                id_spr = item.get('id_spr')
                hard = item.get('hard')
                expire_date = item.get('dt')                    
                if vnd and id_spr:
                    index_id = ':%:'.join([str(vnd), str(id_spr), expire_date if expire_date else '0', '1' if hard else '0'])
                    if inserts.get(index_id):
                        #апдейтим запись
                        inserts[index_id].append(inn)
                    else:
                        inserts[index_id] = [inn,]
            params = []
            for item in inserts:
                vnd, id_spr, expire_date, hard = item.split(':%:')
                sql = f"""select id_vnd from vnd where c_vnd = '{vnd}';"""
                vnd = self.db.request({"sql": sql, "options": ()})[0][0]
                r = {'inn': inserts.get(item), 'ref_id': str(id_spr), 
                     'scode': str(vnd)
                }
                if remove:
                    r['remove'] = 1
                if expire_date != '0' and not remove: 
                    r['expires'] = expire_date
                if hard != '0' and not remove:
                    r['abso'] = True
                params.append(r)
            _return = []
            if len(params) > 0:
                self._make_msg(user, params)
                pool = ThreadPool(len(params))
                results = pool.map(self._set_vnd, params)
                pool.close()
                pool.join()
                for i, result in enumerate(results):
                    _return.append({"params": params[i], "result": result})
                    self.log(f"\nQ: {params[i]}\nA: {result}")
            ret = {"result": True, "ret_val": _return}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _set_vnd(self, params):
        if not self.production or isinstance(params, tuple):
            time.sleep(0.25)
            return True #enable for test
        rpc = ms71lib.ServerProxy("https://sklad71.org/apps/mrksrv/uri/RPC2", api_key=self.key)
        ret = rpc.plx("reference_links_change", **params)[0]
        rpc('close')()
        return ret


    def getVnd(self, params=None, x_hash=None):
        t0 = time.time()
        if self._check(x_hash):
            all_vnd = params.get('all')
            #user = params.get('user')
            customers = params.get('customers')
            id_spr = params.get('id_spr')
            _ret_all = []
            items = []
            timing = {"t2": 0, "t3": 0, "t4": 0}
            sql = """select id_vnd, c_vnd, merge3 from vnd order by c_vnd;"""
            result = self.db.request({"sql": sql, "options": ()})
            _all_vnds = []
            for row in result:
                r = {
                    "id_vnd": row[0],
                    "c_vnd": row[1]
                }
                _all_vnds.append(r)
                if int(row[2]) != 1:
                    _ret_all.append(r)
            if customers:
                sql = f"""select inn, c_inn from companies where inn in ({','.join(["'%s'"%i for i in customers])});"""
                result = self.db.request({"sql": sql, "options": ()})
                names = {}
                for row in result:
                    names[int(row[0])] = row[1]
            t2 = time.time()
            timing["t2"] = t2-t0
            if not all_vnd:
                if customers and id_spr:
                    #get inns using customers
                    inns = customers.copy()
                    rpc = ms71lib.ServerProxy("https://sklad71.org/apps/mrksrv/uri/RPC2", api_key=self.key)
                    plxdata = rpc.plx('reference_links_search', ref_id=str(id_spr))[0]
                    rpc('close')()
                    t3 = time.time()
                    timing["t3"] = t3-t2
                    for item in plxdata:
                        if item[0] in inns:
                            t = {
                                "inn": item[0],
                                "c_inn": names.get(int(item[0])),
                                "id_vnd": item[1],
                                "id_spr": item[2],
                                "dt": item[3],
                                "hard": 1 if item[4] == True else 0,
                                "c_vnd": "",
                                "id": ""
                            }
                            for q in _all_vnds:
                                if str(q['id_vnd']) == str(item[1]):
                                    t["c_vnd"] = q["c_vnd"]
                                    break
                            t['id'] = str(t['inn'])+str(t['c_vnd'])
                            items.append(t)
                        t4 = time.time()
                        timing["t4"] = t4-t3
            _return = {'all': _ret_all if all_vnd else [], "active": items}
            ret = {"result": True, "ret_val": _return, "timing": timing}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)


    def getSprSearch(self, params=None, x_hash=None):
        st_t = time.time()
        if self._check(x_hash):
            start_p = int( params.get('start', self.start))
            start_p = 1 if start_p < 1 else start_p
            end_p = int(params.get('count', self.count)) + start_p -1
            field = params.get('field', 'c_tovar')
            field = 'r.' + field
            direction = params.get('direction', 'asc')
            search_re = params.get('search')
            search_re = search_re.replace("'", "").replace('"', "")
            search_re = search_re.split('+')
            if len(search_re) > 1:
                search_sup = search_re[1]
            else:
                search_sup = ''
            search_re = search_re[0]
            search_re = search_re.split()
            search_sup = search_sup.split()
            stri = [] if len(search_re) > 0 else ["lower(r.C_TOVAR) like lower('%%')",]
            stri1 = [] 
            for it in search_sup:
                ts2 = "lower(z.C_ZAVOD) like lower('%" + it.strip() + "%')"
                stri1.append('and %s' % ts2)
            for i in range(len(search_re)):
                ts1 = "lower(r.C_TOVAR) like lower('%" + search_re[i].strip() + "%')"
                if i == 0:
                    stri.append(ts1)
                else:
                    stri.append('and %s' % ts1)
            stri = ' '.join(stri)
            stri1 = ' '.join(stri1)
            sql_c = f"""SELECT count(*)
FROM SPR r WHERE {stri};"""
            sql_c = sql_c.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            sql = f"""SELECT r.ID_SPR, r.C_TOVAR, z.C_ZAVOD, c.C_STRANA
FROM SPR r
join spr_zavod z on z.id_spr = r.id_zavod {stri1}
join spr_strana c on c.id_spr = r.id_strana
WHERE ({stri}) ORDER by {field} {direction}"""

            sql = sql + self._insLimit(start_p, end_p)
            sql = sql.replace("WHERE lower(r.C_TOVAR) like lower('%%%%')", '')
            sql = sql.replace("and lower(r.C_ZAVOD) like lower('%%%%')", '')
            t1 = time.time() - st_t
            _return = []
            p_list = [{'sql': sql, 'opt': ()}, {'sql': sql_c, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            result = results[0]
            count = results[1][0][0]
            st_t = time.time()
            for row in result:
                r = {
                    "id_spr"        : row[0],
                    "c_tovar"       : row[1],
                    "c_zavod"       : row[2],
                    "c_strana"      : row[3],
                    "search"        : params.get('search')
                }
                _return.append(r)
            t2 = time.time() - st_t
            ret = {"result": True, "ret_val": {"datas": _return, "total": count, "start": start_p, "time": (t1, t2), 'params': params}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)


#     def getPrcsItem(self, params=None, x_hash=None):  # ####################
#         if self._check(x_hash):
#             sh_prc = params.get('sh_prc')
#             sql = f"""
# select r.SH_PRC, r.ID_VND, r.ID_TOVAR, r.N_FG, r.N_CENA, r.C_TOVAR, r.C_ZAVOD, r.ID_ORG, r.C_INDEX, u."USER", v.C_VND
# from prc r
# inner join USERS u on (u."GROUP" = r.ID_ORG)
# INNER JOIN VND v on (r.ID_VND = v.ID_VND)
# WHERE r.SH_PRC = {self._wildcardIns()}
#             """
#             opt = (sh_prc,)
#             _return = []
#             result = self.db.request({"sql": sql, "options": opt})
#             for row in result:
#                 r = {
#                     "sh_prc"  : row[0],
#                     "id_vnd"  : row[1],
#                     "id_tovar": row[2],
#                     "n_fg"    : row[3],
#                     "n_cena"  : row[4],
#                     "c_tovar" : row[5],
#                     "c_zavod" : row[6],
#                     "id_org"  : row[7],
#                     "c_index" : row[8],
#                     "c_user"  : row[9],
#                     "c_vnd"   : row[10]
#                 }
#                 _return.append(r)

#             ret = {"result": True, "ret_val": {"datas" :_return[0], 'params': params}}
#         else:
#             ret = {"result": False, "ret_val": "access denied"}
#         return json.dumps(ret, ensure_ascii=False)



    def setMerge3(self, params=None, x_hash=None):
        if self._check(x_hash):
            m3 = params.get('m3')
            m = params.get('m')
            sql_m3 = f"update vnd set merge3=0 where id_vnd in ({', '.join([str(i.get('id')) for i in m3])}) returning merge3;"
            sql_m = f"update vnd set merge3=1 where id_vnd in ({', '.join([str(i.get('id')) for i in m])}) returning merge3;"
            p_list = [{'sql': sql_m3, 'opt': ()}, {'sql': sql_m, 'opt': ()}]
            pool = ThreadPool(2)
            results = pool.map(self._make_sql, p_list)
            pool.close()
            pool.join()
            if results[0] and results[1]:
                ret = {"result": True, "ret_val": "OK"}
            else:
                ret = {"result": False, "ret_val": "setMerge3 sql error"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def getMerge3(self, params=None, x_hash=None):
        if self._check(x_hash):
            sql = "select id_vnd, c_vnd, merge3 from vnd order by c_vnd;"
            opt = ()
            result = self.db.request({"sql": sql, "options": opt})
            m3 = []
            m = []
            for row in result:
                r = {
                    "id": row[0],
                    "c_vnd" : row[1]
                }
                if int(row[2]) != 1:
                    m3.append(r)
                else:
                    m.append(r)
            ret = {"result": True, "ret_val": {"m3": m3, "m": m}}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return json.dumps(ret, ensure_ascii=False)

    def _make_sql(self, params):
        sql = params.get('sql')
        opt = params.get('opt')
        res = self.db.execute({"sql": sql, "options": opt})
        #res = self.db.request({"sql": sql, "options": opt})
        return res

    def _check(self, x_hash):
        #проверка валидности ключа
        ret = False
        if x_hash:
            f_name = os.path.join(self.p_path, x_hash)
            if os.path.exists(f_name):
                ret = True
        return ret

    def _insLimit(self, start_p, end_p):
        if self._pg:
            rrr = f""" limit {end_p - start_p + 1} offset {start_p-1}"""
        else:
            rrr = f""" ROWS {start_p} to {end_p}"""
        return rrr


    def _make_sql_plx(self, params):
        sql_template = """select o.inn, o.title, 
s.code, s.title,
r.ref_id, r.expires, r.abso
from app_referencelink r 
join app_org o on o.id = r.org_id and o.inn %s
join app_supplier s on s.id = r.supplier_id
where  r.expires is null or r.expires >= current_timestamp
order by r.ref_id, s.code, o.inn;"""
        sql = params.get('sql')
        inn = params.get('inn')
        if len(inn) == 1:
            inn = f"= '{str(inn[0])}'\n"
        elif len(inn) > 1:
            inn = f"in {str(tuple(inn))}\n"
        sql = sql_template % inn
        ret = []
        #5 попыток
        for t in range(5):
            try:
                plx = ms71lib.ServerProxy(f"https://sklad71.org/apps/fdbsrv@plx-db/uri/RPC2", api_key=self.key)
                ret = plx.fdb.execute('plx', sql)
            except:
                sl = 0.3*(t+1)
                self.log(f"""PLX_ERROR_TEXT:\n{traceback.format_exc()}""")
                self.log(f"""PLX_ERROR_SLEEP_FOR: {sl} secs.; ATTEMPT: {t+1}""")
                time.sleep(sl)
            else:
                break
            finally:
                try:
                    plx('close')()
                except: pass
        if ret:
            for row in ret:
                yield row


    def _genCsv(self, output_data, sep='\t'):
        out_data = []
        if len(output_data) > 0:    
            for row in output_data:
                out_data.append(sep.join([str(i) for i in row]))
            out_data = '\n'.join(out_data)
        return out_data.encode()


    def _genXlsx(self, data):
        ret_object = io.BytesIO()
        ret_data = None
        properties = {
            'title':    'report',
            'category': 'Utility',
        }
        x = 6.5
        workbook = xlsx.Workbook(ret_object, {'in_memory': True})
        workbook.set_properties(properties)
        cell_format = {}
        cell_format['header'] = workbook.add_format({'font_size': '8', 'bold': True, 'align': 'center', 'bottom': 1})
        cell_format['row'] = workbook.add_format({'font_size': '8', 'align': 'left'})
        if len(data) > 0:
            x = len(data[0])
            y = len(data)
            worksheet = workbook.add_worksheet('report')
            worksheet.set_print_scale(100)
            j = 0
            max_widths = {}
            while data:
                row = data.pop(0)
                for i in range(len(row)):
                    d1 = row[i]
                    l = len(str(d1))
                    if j == 0:
                        max_widths[i] = l
                    if max_widths[i] < l:
                        max_widths[i] = l
                worksheet.write_row(j, 0, row, cell_format['header' if j==0 else 'row'])
                j += 1
            for i in max_widths:
                worksheet.set_column(i, i, max_widths[i]*(x if max_widths[i] > 10 else 9))
            worksheet.set_paper(9) #размер А4
            worksheet.set_portrait() #портретная ориентация
            worksheet.set_margins(left=1, right=0.5, top=0.5, bottom=0.5)

            worksheet.autofilter(0, 0, y-1, x-1)

            workbook.close()
            ret_data = ret_object.getvalue()
            ret_object.close()
        return ret_data

    def makeReport(self, params=None, x_hash=None):
        sql_spr = """select s.id_spr, s.c_tovar, c.c_strana, z.c_zavod
from spr s
left join spr_strana c on s.id_strana = c.id_spr
left join spr_zavod z on s.id_zavod = z.id_spr;"""
        if self._check(x_hash):
            inns = params.get('inn')
            if not isinstance(inns, list):
                inns = [inns, ]
            if inns:
                spr = {}
                ret = self._make_sql({"sql": sql_spr, "opt": ()})
                for row in ret:
                    spr[row[0]] = list(row[1:])
                c = 0
                output_data = [["ИНН", "Организация", "Код поставщика", "Поставщик", "Код товара", "Название товара", "Страна", "Производитель", "Срок действия", "Жесткость"], ]
                for row in self._make_sql_plx({"sql": '', 'inn': inns}):
                    row_new = []
                    row_new = row[0:5]
                    spr_info = spr.get(row[4], -1)
                    if spr_info == -1:
                        c += 1
                        continue
                    row_new.extend(spr_info)
                    if not row[5]:
                        row[5] = 'Не установленно'
                    row[6] = 'Жестко' if row[6] else ''
                    row_new.extend(row[5:])
                    output_data.append(row_new)
                if output_data:
                    output_data = self._genXlsx(output_data)
                    # output_data = self._genCsv(output_data)
                    if output_data:
                        ret = {"result": True, "ret_val": {'type': 'xlsx', 'data': output_data}}
                    else:
                        ret = {"result": False, "ret_val": "file can not created"}    
                else:
                    ret = {"result": False, "ret_val": "no data generated"}
            else:
                ret = {"result": False, "ret_val": "no_inn"}
        else:
            ret = {"result": False, "ret_val": "access denied"}
        return ret