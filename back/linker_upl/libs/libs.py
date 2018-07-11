#coding: utf-8

import re
import os
import sys
import glob
import json
import time
import uuid
import fcntl
import errno
import shutil
import socket
import hashlib
import threading
import traceback
import subprocess
import configparser
from urllib.parse import unquote
from libs.lockfile import LockWait
from libs.connect import fb_local
from multiprocessing.dummy import Pool as ThreadPool
try:
    import libs.fdb as fdb
except ImportError:
    import fdb

class API:
    """
    API class for http post access
    x_hash - API key
    """
    
    def __init__(self, Lock, log, w_path = '/ms71/data/linker_upl', p_path='/ms71/data/linker_upl/restricted'):
        self.methods = []
        self.path = w_path
        self.p_path = p_path
        self.inw_path = os.path.join(self.path, 'in_work')
        if not os.path.exists(self.path):
             os.makedirs(self.path, mode=0o777)
        if not os.path.exists(self.p_path):
             os.makedirs(self.p_path, mode=0o777)
        if not os.path.exists(self.inw_path):
             os.makedirs(self.inw_path, mode=0o777)
        self.lock = Lock
        self.exec = sys.executable
        self.log = log
        self.nauth = {}
        try:
            config = configparser.ConfigParser()
            config.read('/ms71/saas/linker/conf.ini', encoding='UTF-8')
            init = config['init']
            self.nauth = config['nauth']
            self.connect_params = {
                    'uri': init['uri'],
                    'api_key': init['api'],
                    'allow_none': True
                    }
            self.connect_params = {
                    "host": "127.0.0.1",
                    "port": 8025,
                    "database": "spr",
                    "user": 'SYSDBA',
                    "password":'masterkey',
                    "charset" : 'WIN1251'
                    }
            self.production = True
        except Exception as Err:
            self.log(Err, kind="ERROR")
            self.production = False
            self.connect_params = {
                    "host": "localhost",
                    "database": "spr",
                    "user": 'SYSDBA',
                    "password":'masterkey',
                    "charset" : 'WIN1251'
                    }
        
        if callable(self.log):
            self.log("Production" if self.production else "Test")
        else:
            print("Production" if self.production else "Test", flush=True)

    def _connect(self):
        try:
            con = fdb.connect(**self.connect_params)
        except Exception as Err:
            self.log(traceback.format_exc(), kind="error:connection")
        else:
            cur = con.cursor()
        #if self.production:
            #try:
                #con = ms71_cli.ServerProxy(**self.connect_params)
            #except Exception as Err:
                #self.log(traceback.format_exc(), kind="error:connection")
            #else:
                #cur = con.fdb
        #else:
            #try:
                #con = fdb.connect(**self.connect_params)
            #except Exception as Err:
                #self.log(traceback.format_exc(), kind="error:connection")
            #else:
                #cur = con.cursor()
        return con, cur

    def _check(self, x_hash):
        #проверка валидности ключа
        return True

    def upload_nolinks(self, params, x_hash):
        #загрузка данных по накладным из json
        ret = {"result": False, "ret_val": "access denied"}
        if self._check(x_hash):
            #source = 2
            callback = None
            data = params
            #ключ словаря - идентификатор накладной, значение - список строк товаров для сведения в фомате tab separated, все как в файле:
            #sh_prc, код поставщика, код товара у поставщика, название товара, изгтовитель, код организации, штрихкод
            name, value = data.popitem()
            source = 2 if len(name) > 25 else 1
            self.log('source: %s' % source)
            self.log('*'*50)
            self.log(value)
            con, cur = self._connect()
            h_name = hashlib.md5()
            h_name.update(str(name).encode())
            h_name =  h_name.hexdigest()
            sql = f"insert into PRC_TASKS (uin, source, callback, dt) values ('{h_name}', {int(source)}, '{callback}', current_timestamp)"
            try:
                cur.execute(sql)
                con.commit()
            except:
                self.log("Can't insert task", kind="SQLError")
            finally:
                con.close()
            f_name = os.path.join(self.path,f"{h_name}.{source}")
            with open(f_name, 'wb') as f_obj:
                pass
                f_obj.write(value.encode())
            ret = {"result": True, "ret_val": "accepted"}
            self.log('*'*50)
            #ret = {"result": True, "ret_val": "ok"}
            
        return json.dumps(ret, ensure_ascii=False)

    def upload_file(self, filename, data, source=0, callback=None):
        if source == 'linker':
            f_data = data.split(b'\r\n')
            f_data = f_data[4:-2]
            f_data = b'\r\n'.join([i.strip() for i in f_data])
            source = 2
        else:
            f_data = data
        con, cur = self._connect()
        h_name = hashlib.md5()
        h_name.update(str(filename).encode())
        h_name =  h_name.hexdigest()
        sql = f"insert into PRC_TASKS (uin, source, callback, dt) values ('{h_name}', {int(source)}, '{callback}', current_timestamp)"
        self.log(sql)
        cur.execute(sql)
        con.commit()
        fname = os.path.join(self.path, f"{h_name}.{source}")
        try: 
            with open(fname, 'wb') as f_obj:
                f_obj.write(f_data)
        except:
            self.log(traceback.format_exc(), kind="error:write:file")
            ret = {"result": False, "ret_val": "write error"}
        else:
            ret = {"result": True, "ret_val": 'accept'}
        return json.dumps(ret, ensure_ascii=False)

    def process(self, params, x_hash):
        try: 
            con, cur = self._connect()
            self._load_from_nolink(con, cur)
            self.prc_sync_lnk(con, cur)
            con.close()
        except:
            ret = {"result": False, "ret_val": "db error"}
        else:
            ret = {"result": True, "ret_val": "ok"}
        return json.dumps(ret, ensure_ascii=False)

    def clean(self, params, x_hash):
        try:
            con, cur = self._connect()
            self._erase_prc(con, cur)
            con.close()
        except:
            self.log(traceback.format_exc(), kind="error:clean:db")
            ret = {"result": False, "ret_val": "db error"}
        else:
            ret = {"result": True, "ret_val": "ok"}
        self.log(ret)
        return json.dumps(ret, ensure_ascii=False)

    def _load_from_nolink(self, db, dbc):
        if db:
            sql = """SELECT r.CODE, r.NAME FROM LNK_CODES r where r.PROCESS = 1"""
            dbc.execute(sql)
            ret = dbc.fetchall()
            count_insert = 0
            count_all = 0
            for id_vnd, v in ret:
                id_vnd = int(id_vnd)
                f_mask = os.path.join(self.path, "price%s*.nolink" % id_vnd)
                for path in glob.glob(f_mask):
                    self.log(f"path: {path}")
                    count_insert, count_all = self.upload_to_db(db, dbc, id_vnd, path, count_insert, count_all)
                    self.log("- remove: ")
                    try: 
                        os.remove(path)
                        self.log("[ OK ]")
                    except Exception as e:
                        self.log("[FAIL]")
                        self.log(str(e), kind="error")
            self.log(f"Добавил в PRC - {count_insert}")
            self.log(f"Всего nolnk - {count_all}")
            return True
        else:
            return False

    def upload_to_db(self, db, dbc, id_vnd, path, count_insert, count_all, source=1):
        uin = os.path.basename(path).split('.')[0]
        if uin.split('.')[0] != uin:
            uin = None
        _re = re.compile("\(..\...\)")
        rows = []
        with open(path, 'rb') as f:
            rows = f.read()
        rows = rows.decode('utf8').splitlines()
        self.log(f"- Всего в файле: {len(rows)}")
        count_all+=len(rows)
        ret = []
        if rows:
            c = 0
            ins_params = []
            for row in rows:
                fgCont = False
                kod, tovar, zavod, idorg, barcode, sh_brak, series, dt_brak = "", "", "", "0", None, "", "", ""
                try:
                    _, kod, tovar, zavod, idorg, sh_brak, series, dt_brak = row.split('\t')[0:8]
                except:
                    try:
                        _, kod, tovar, zavod, idorg, barcode = row.split('\t')[0:6]
                        barcode = barcode.strip()
                    except:
                        try:
                            _, kod, tovar, zavod, idorg = row.split('\t')[0:5]
                        except:
                            _, kod, tovar, zavod = row.split('\t')[0:4]
                try:
                    idorg = int(idorg.strip())
                except:
                    idorg = 0
                try:
                    cena = 0
                    if id_vnd == 20171:
                        fgCont = kod.find('/')>-1
                    tovar = tovar.replace(u' /ЖНВЛС/', '')
                except:
                    fgCont = True
                try:
                    zavod = zavod[zavod.find('>')+1:]
                except:
                    pass
                if fgCont: 
                    continue
                if _re.search(tovar):
                    continue
                try:
                    cena = int(float(cena)*100)
                except:
                    cena = 0    
                                    
                # Формируем хеш                 
                if id_vnd in [28177,28132,28176,28178]:
                    _id_vnd = 28162
                elif id_vnd in [20577,20576]:
                    _id_vnd = 20557
                elif id_vnd in [20662]:
                    _id_vnd = 20677
                elif id_vnd in [20477]:
                    _id_vnd = 20471
                elif id_vnd in [20177,20153,20176,20129]:
                    _id_vnd = 20171
                elif id_vnd in [45835,51066]:
                    _id_vnd = 44735
                elif id_vnd in [20276,20229,20269]:
                    _id_vnd = 20277
                elif id_vnd in [20378]:
                    _id_vnd = 20377
                elif id_vnd in [30144]:
                    _id_vnd = 30178
                else:
                    _id_vnd = id_vnd
                # Добавление забракованных серий
                if sh_brak and series:
                    self.log(f'забраковка: {sh_brak}, {series}')
                    sql = "UPDATE OR INSERT INTO BRAK(SH_PRC, SERIES, DT)VALUES(?,?,?) MATCHING(SH_PRC, SERIES)"
                    dbc.execute(sql, (sh_brak, series, dt_brak))
                    if callable(db.commit):
                        db.commit()
                try:
                    sh_prc = self._genHash(_id_vnd, tovar, zavod)
                except Exception as Err:
                    continue
                barcode = barcode if barcode else None
                source = source#1 - прайслистэксперт, 2 - склад
                inss = (id_vnd, kod, cena, sh_prc, tovar.replace("'","''"), zavod.replace("'","''"), idorg, source, barcode, uin)
                ins_params.append(inss)
            sql = """UPDATE or INSERT INTO A_TEMP_PRC (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, source, barcode, uin)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"""
            if len(ins_params) > 0:
                dbc.executemany(sql, ins_params)
                if callable(db.commit):
                    db.commit()
                self.log('inserted')
                for row in self._getGen(dbc, "SELECT sh_prc, barcode FROM A_TEMP_PRC WHERE barcode is NOT NULL"):
                    dbc.execute("SELECT l.ID_SPR FROM LNK l WHERE l.SH_PRC = ?", (row[0],))
                    ret = dbc.fetchone()
                    if ret:
                        dbc.execute("UPDATE spr set barcode = ? where id_spr = ? and barcode is null", (row[1], ret[0]))
                        dbc.execute("UPDATE or INSERT INTO spr_barcode (barcode, id_spr) values (?, ?) MATCHING (barcode, id_spr)", (row[1], ret[0]))
                self.log('updated barcodes')
                dbc.execute("""DELETE FROM A_TEMP_PRC WHERE sh_prc in 
    (SELECT r.SH_PRC FROM A_TEMP_PRC r
        JOIN LNK l on l.SH_PRC = r.SH_PRC)""")
                self.log('sames with lnk deleted')
                dbc.execute("""  UPDATE PRC SET PRC.C_INDEX = PRC.C_INDEX + 1
    WHERE PRC.SH_PRC in ( SELECT r.SH_PRC FROM PRC r
        WHERE EXISTS (SELECT p.SH_PRC FROM A_TEMP_PRC p
               WHERE p.SH_PRC = r.SH_PRC) )""")
                self.log('doubles in prc uddated')
                dbc.execute("""DELETE FROM A_TEMP_PRC WHERE SH_PRC in (
    SELECT r.SH_PRC FROM PRC r WHERE EXISTS (
        SELECT p.SH_PRC FROM A_TEMP_PRC p
        WHERE p.SH_PRC = r.SH_PRC))""")
                self.log('doubles with prc deleted')
                for row in self._getGen(dbc, """    SELECT r.sh_prc FROM A_TEMP_PRC r 
    JOIN (select rr.BARCODE bc, count(rr.BARCODE) cbc FROM A_TEMP_PRC rr
        JOIN SPR_BARCODE s on s.BARCODE = rr.BARCODE
        where rr.BARCODE is NOT NULL GROUP by rr.BARCODE HAVING COUNT(rr.BARCODE) > 1) on bc = r.BARCODE"""):
                    dbc.execute("""INSERT INTO prc (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, in_work, source, uin)
    SELECT r.id_vnd, r.id_tovar, r.n_cena, r.sh_prc, r.c_tovar, r.c_zavod, r.id_org, -1, r.source, r.uin
    FROM A_TEMP_PRC r where r.SH_PRC = ?""", (row[0],))
                    dbc.execute("""DELETE FROM A_TEMP_PRC WHERE SH_PRC = ?""", (row[0],))
                #self.log('some actions')
                dbc.execute("""INSERT INTO lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)
    select r.SH_PRC, s.ID_SPR, r.ID_VND, r.ID_TOVAR, r.C_TOVAR, r.C_ZAVOD, CURRENT_TIMESTAMP, 'barcode'
    FROM A_TEMP_PRC r JOIN SPR_BARCODE s on s.BARCODE = r.BARCODE""")
                self.log('linked by barcode')
                dbc.execute("""DELETE FROM A_TEMP_PRC a WHERE a.SH_PRC in (
    select r.SH_PRC FROM A_TEMP_PRC r JOIN SPR_BARCODE s on s.BARCODE = r.BARCODE) """)
                dbc.execute("""SELECT COUNT(*) FROM A_TEMP_PRC""")
                count_i = dbc.fetchone()[0]
                dbc.execute("""INSERT INTO prc (ID_VND, ID_TOVAR, N_CENA, SH_PRC, C_TOVAR, C_ZAVOD, ID_ORG, in_work, source, uin)
    SELECT r.id_vnd, r.id_tovar, r.n_cena, r.sh_prc, r.c_tovar, r.c_zavod, r.id_org, -1, r.source, r.uin
    FROM A_TEMP_PRC r """)
                dbc.execute("""DELETE FROM A_TEMP_PRC""")
                if callable(db.commit):
                    db.commit()
                count_insert += count_i
        return count_insert, count_all

    def _getGen(self, dbc, sql):
        dbc.execute(sql)
        ret = dbc.fetchall()
        for row in ret:
            yield row

    def _genHash(self, id_vnd, tovar, zavod):
        s = u''.join((tovar.replace(u' /ЖНВЛС/', ''), zavod)).upper().replace(',', '.').split()
        n = []
        s1 = []
        for x in u''.join(s):
            c = ord(x)
            if c > 57:
                s1.append(x)
            elif c > 47:
                n.append(x)
        s1.sort()
        n.extend(s1)
        s = u''.join(n)
        sh_prc = hashlib.md5()
        sh_prc.update(str(id_vnd).encode())
        sh_prc.update(s.encode('1251'))
        buf =  sh_prc.hexdigest()
        return sh_prc.hexdigest()


    def _erase_prc(self, db, dbc):
        #очищаем PRC если такие ключи есть в LNK
        dbc.execute(u"""delete from prc pp
        where pp.sh_prc in (select p.sh_prc from prc p join lnk ll on ll.sh_prc = p.sh_prc)""")
        if callable(db.commit):
            db.commit()
        #удаляем из spr_barcode позиции, которых нет в SPR
        dbc = db.cursor()
        dbc.execute(u"""delete from spr_barcode bb where bb.id_spr in (
        select b.id_spr from spr_barcode b
        left join spr s
        on b.id_spr=s.id_spr
        where s.id_spr is null)""")
        if callable(db.commit):
            db.commit()

    def prc_sync_lnk(self, db, dbc, uin=None):
        if uin:
            con_ins = f"and uin = '{uin}'"
        else:
            con_ins = "and dt > CURRENT_DATE - 3"
        #self._erase_prc()
        sq = """SELECT r.NAME, r.OPTIONS FROM LNK_EXCLUDES r where r.PROCESS = 1"""
        dbc.execute(sq)
        ret = dbc.fetchall()
        ap = []
        for row in ret:
            if row[1][1] == '1':
                st = "c_tovar CONTAINING '%s'" % row[0]
            else:
                st = f"upper(c_tovar) like upper('{row[0]}%')"
            ap.append(st)
        ap = ' \nor '.join(ap)
        sql = """update PRC set n_fg=1, id_org=0 where n_fg!=1 and source != 2 %s and (%s)""" % (con_ins, ap)
        self.log("Удаляем по признаку")
        dbc.execute(sql)
        if callable(db.commit):
            db.commit()
        self.log('Сводим по кодам')
        sql = """insert into lnk (SH_PRC, ID_SPR, ID_VND, ID_TOVAR, C_TOVAR, C_ZAVOD, DT, OWNER)
    select DISTINCT p.sh_prc, l.id_spr, p.id_vnd, p.id_tovar, p.c_tovar, p.c_zavod, current_timestamp, 'robot'
    from prc p 
    join lnk l on l.id_vnd = p.id_vnd and l.id_tovar = p.id_tovar and p.id_tovar<>'' and p.id_tovar is not null and p.id_tovar<>' '
        and (select count(distinct ll.id_spr) as ccc
            from prc pp
            join lnk ll on ll.id_vnd = pp.id_vnd and ll.id_tovar = pp.id_tovar
            where pp.id_vnd = p.id_vnd and pp.id_tovar = p.id_tovar
            ) = 1 
    where p.id_vnd in (20269,30144,51066,28178,40267,40277,48929,20129,20378,20229,20276,28176,20576,20176,20153,34157,44735,45277,41977,20577, 20557, 40552, 21271, 29977,22240, 20171, 20277, 20677, 20871, 20377, 22077, 24477, 28162, 28177, 20477, 23478,  20977, 30178, 28132)
        """
        dbc.execute(sql)
        dbc.execute(u"""delete from prc pp where pp.sh_prc in (select p.sh_prc from prc p join lnk ll on ll.sh_prc = p.sh_prc)""")
        if callable(db.commit):
            db.commit()
        self.log('Закончил сведение по кодам')
        dbc.execute(f"""update prc set id_org = 12 where id_org = 0 and n_fg = 0 {con_ins} and (id_vnd<>30000 and id_vnd<>20271 and id_vnd<>44677 and id_vnd<>43136)""")
        if callable(db.commit):
            db.commit()
        #self.log('assign to stasya')
        dbc.execute(f"""update prc set id_org = 12 where id_org<>12 and  id_org <> 0 and n_fg <> 1 and  n_fg= 0 and n_fg<> 12 {con_ins}
    and (id_vnd in (46676,20269,30144,51066,28178,51072,19987,40267,40277,20129,20378,20229,48761,40677,44877,19990,46769,47369,45177,46869,20276,44735,20576,28176,45835,20176,20153,19992,19996,20657,44677,20177,41177,45277,20271,10001,29271,34071,37471,33771,30371,34157,20471,20557,20577,20171,40552,21271,29977,22240,20171,20277,20677,20871,20377,22077,24477,28162,28177,28132,23478,20977,30178))""")
        #self.log('assign to stasya 2')
        if callable(db.commit):
            db.commit()
        dbc.execute(f"""update prc set id_org=40035 where id_org=12 {con_ins} and (id_vnd=19994 or id_vnd=19985)""")
        if callable(db.commit):
            db.commit()
        #self.log('assign to 40035')
        #dbc.execute(f"""update prc set id_org=40035 where id_vnd=19985 and id_org=12 {con_ins}""")
        #if callable(db.commit):
            #db.commit()

    def getNameByCode(self, id_vnd):

        vnd_name = None
        try:
            con, cur = self._connect()
        except Exception as Err:
            self.log(Err, kind="SQLError")
        else:
            try:
                sql = """select count(*) from vnd where id_vnd = ?"""
                opt = (id_vnd,)
                cur.execute(sql, opt)
                res = int(cur.fetchone()[0])
                if res == 0:
                    #если записи нет, то вычитываем название и апдейтим таблицы
                    code = [id_vnd,]
                    res1 = requests.post(self.nauth['url'], auth=(self.nauth['login'], self.nauth['pwd']),  json={"method": "namepost", "params": [code,]})
                    res1 = res1.json().get('result')[0]
                    vnd_name = res1.get(str(id_vnd))
                    sql = """insert into VND (ID_VND, C_VND, MERGE3) values (?, ?, 0)"""
                    opt = (id_vnd, vnd_name)
                    cur.execute(sql, opt)
                    sql = """insert into USER_VND (ID_USER, ID_VND) values (12, ?)"""
                    opt = (id_vnd,)
                    cur.execute(sql, opt)
                    con.commit()
            except Exception as Err:
                self.log(Err, kind="GetNameError")
                self.log(traceback.format_exc(), kind="GetNameError")
        finally:
            try:
                con.close()
            except Exception as Err:
                self.log(Err, kind="SQLError")
                
            
        return vnd_name


class fLock:
    """
    File locking class. Intended for use with the `with` syntax.
    """
    def __init__(self, path):
        self._path = path
        self._fd = None

    def __enter__(self):
        self._fd = os.open(self._path, os.O_CREAT)
        while True:
            try:
                fcntl.flock(self._fd, fcntl.LOCK_EX | fcntl.LOCK_NB) # try to acquire the Lock
                return
            except (OSError, IOError) as ex:
                if ex.errno != errno.EAGAIN: # Resource temporarily unavailable
                    raise
            time.sleep(0.01)

    def __exit__(self, *args):
        fcntl.flock(self._fd, fcntl.LOCK_UN)
        os.close(self._fd)
        self._fd = None

def getip(log):
    """
    get ip's function
    """
    _urls = ('https://sklad71.org/consul/ip/', 'http://ip-address.ru/show','http://yandex.ru/internet',
        'http://ip-api.com/line/?fields=query', 'http://icanhazip.com', 'http://ipinfo.io/ip',
        'https://api.ipify.org')
    s = r"[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
    eip = None
    iip = ''
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as se:
            se.connect(("77.88.8.8", 80))
            iip = se.getsockname()[0]
    except Exception as e:
        log(f"err:{str(e)}")
    import ssl, re, urllib.request
    ssl._create_default_https_context = ssl._create_unverified_context
    for url in _urls:
        r = None
        data = ''
        try:
            with urllib.request.urlopen(url, timeout=2) as r:
                data = str(r.headers)
                data += r.read().decode()
                eip = re.findall(s, data)[0].strip()
                break
        except Exception as e:
            continue
    return eip, iip

class logs:
    """
    logging class
    """
    def __init__(self, hostname=None, version=None, appname=None, profile=None):
        self.hostname = hostname
        self.version = version
        self.appname = appname
        self.profile = profile

    def __call__(self, msg, kind='info', begin='', end='\n'):
        try:
            ts = "%Y-%m-%d %H:%M:%S"
            try: ts = time.strftime(ts)
            except: ts = time.strftime(ts)
            if self.hostname:
                if self.profile:
                    s = '{0}{1} {2} {4}.{5}:{3}:{6} {7}{8}'.format(begin, ts, self.hostname, self.version, self.appname, self.profile, kind, msg, end)
                else:
                    s = '{0}{1} {2} {4}:{3}:{5} {6}{7}'.format(begin, ts, self.hostname, self.version, self.appname, kind, msg, end)
            else:
                if self.profile:
                    s = '{0}{1} {3}.{4}:{2}:{5} {6}{7}'.format(begin, ts, self.version, self.appname, self.profile, kind, msg, end)
                else:
                    s = '{0}{1} {3}:{2}:{4} {5}{6}'.format(begin, ts, self.version, self.appname, kind, msg, end)
            sys.stdout.write(s)
            sys.stdout.flush()
        except:
            traceback.print_exc()

class SCGIServer:
    """
    SCGI Server class
    """

    def __init__(self, log, hostname=None, version=None, appname=None, profile=None, index=None):
        self.log = log
        self.hostname = hostname
        self.version = version
        self.appname = appname
        self.profile = profile
        self.index = index

    def serve_forever(self, addr, handle_request):
        sock = None
        if type(addr) is str:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
        else:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind(addr)
        #sock.listen(10)
        initial_value = None
        initial_value = self._init(sock)
        try:
            while True:
                _conn, _addr = sock.accept()
                _t = threading.Thread(target=self._handle_conn, args=(_conn, _addr, handle_request, initial_value))
                _t.env = None
                _t.daemon = True
                _t.start()
        finally:
            try: sock.close()
            except: pass

    def _handle_conn(self, conn, addr, handle_request, initial_value):
        env = None
        try:
            conn.settimeout(1)
            rfile = conn.makefile("rb", -1)
            wfile = conn.makefile("wb", 0)
            env = self._env_read(rfile)
            env = self._args_parse(env)
            env["scgi.defer"] = None
            env["scgi.initv"] = initial_value
            env["scgi.rfile"] = rfile
            env["scgi.wfile"] = wfile
            env["CONTENT_LENGTH"] = int(env["CONTENT_LENGTH"])
            threading.current_thread().env = env
            g = handle_request(env)
            wfile.write("Status: {0}\r\n".format(g.__next__()).encode())
            wfile.flush()
            for kv in g.__next__():
                wfile.write(": ".join(kv).encode())
                wfile.write(b"\r\n")
            wfile.write(b"\r\n")
            wfile.flush()
            for data in g:
                wfile.write(data)
                wfile.flush()
        except (BrokenPipeError) as e:
            pass
        except:
            self.log(conn)
            self.log(env)
            traceback.print_exc()
        finally:
            if not wfile.closed:
                try: wfile.flush()
                except: pass
            try: wfile.close()
            except: pass
            try: rfile.close()
            except: pass
            try: conn.shutdown(socket.SHUT_WR)
            except: pass
            try: conn.close()
            except: pass
            if env and env.get("scgi.defer"):
                try:
                    env["scgi.defer"]()
                except:
                    self.log(traceback.format_exc(), kind="error:defer")

    def _env_read(self, f):
        size, d = f.read(16).split(b':', 1)
        size = int(size)-len(d)
        if size > 0:
            s = f.read(size)
            if not s:
                raise IOError('short netstring read')
            if f.read(1) != b',':
                raise IOError('missing netstring terminator')
            items =  b"".join([d, s]).split(b'\0')[:-1]
        else:
            raise IOError('missing netstring size')
        assert len(items) % 2 == 0, "malformed headers"
        env = {}
        while items:
            v = items.pop()
            k = items.pop()
            env[k.decode()] = v.decode()
        return env

    def _args_parse(self, env):
        args = []
        argd = {}
        for x in env.pop('ARGS', '').split('&'):
            i = x.find('=')
            if i > -1:
                k, x  = x[:i], x[i+1:]
            else:
                k = None
            if k:
                argd[unquote(k)] = unquote(x)
            else:
                if x:
                    args.append(unquote(x))
        env['HTTP_PARAMS'] = args
        env['HTTP_KWARGS'] = argd
        return env

    def _init(self, sock):
        addr = sock.getsockname()[:2]
        sock.listen(10)
        sys.APPCONF["addr"] = addr
        fileupstream = self._getfilename("upstream")
        sys.APPCONF["fileupstream"] = fileupstream
        data = """

        location /linker_upl {
         if ($request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';

            add_header 'Access-Control-Max-Age' 1728000;
            add_header 'Content-Type' 'text/plain; charset=utf-8';
            add_header 'Content-Length' 0;
            return 204;
         }
         if ($request_method = 'POST') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';
            add_header 'Access-Control-Expose-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';
         }
         
         if ($request_method = 'HEAD') {
            add_header 'Access-Control-Allow-Origin' '*';
            #add_header 'Access-Control-Allow-Credentials' 'true';
            add_header 'Access-Control-Allow-Methods' 'HEAD, GET, POST, OPTIONS';
            add_header 'Access-Control-Allow-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';
            add_header 'Access-Control-Expose-Headers' 'x-api-key,DNT,X-CustomHeader,Keep-Alive,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Content-Range,Range,Access-Control-Allow-Origin';
         }

        #if (!-f /ms71/data/linker/api-k/$http_x_api_key) {
        #return 403;
        #}

        limit_except POST HEAD OPTIONS GET{
            deny all;
        }
        autoindex                   on;
        client_body_temp_path       temp;
        client_body_in_file_only    clean;
        client_body_buffer_size     16K;
        client_max_body_size        5M;
        include scgi_params;
        #scgi_param                X-BODY-FILE $request_body_file;
        scgi_param                X-API-KEY $http_x_api_key;
        scgi_pass                 linker_upls;
        scgi_buffering            off;
        scgi_cache                off;
    }

    """
        filelocation = self._getfilename("location")
        dn = os.path.dirname(filelocation)
        bs = os.path.basename(filelocation)
        _filelocation = os.path.join(dn, bs.split('.', 1)[0].split('-', 1)[0])  # общий файл для всех экземпляров приложения
        with open(_filelocation, "wb") as f:
            f.write(data.encode())
        sys.APPCONF["filelocation"] = _filelocation
        dn = os.path.dirname(fileupstream)
        bs = os.path.basename(fileupstream)
        _fileupstream = os.path.join(dn, bs.split('.', 1)[0].split('-', 1)[0])  # общий файл для всех экземпляров приложения
        _fileupstreamlock = bs.split('.', 1)[0].split('-', 1)[0]  # _fileupstream + '.lock'
        data1 = """upstream linker_upls {
        least_conn;
        server %s:%s;  # %s
    }
    """ % (addr[0], addr[1], bs)
        data2 = """#   server %s:%s;  # %s""" % (addr[0], addr[1], bs)
        with LockWait(_fileupstreamlock):
            if os.path.exists(_fileupstream):
                with open(_fileupstream, "rb") as f:
                    src = f.read().decode().rstrip().splitlines()
                    # + ' ' + data[1:] + '\n}\n'
                _find = "# %s" % bs
                # fg - пердполагаем, что надо добавлять свой апстрим
                fg = True
                for i in range(1, len(src)-1):
                    if src[i].find(_find) >-1:
                        fg = False
                        src[i] = ' ' + data2[1:]
                        break
                if fg:
                    src[len(src)-1] = ' ' + data2[1:] + '\n}\n'
                src = '\n'.join(src)
                with open(_fileupstream, "wb") as f:
                    f.write(src.encode())
            else:
                with open(_fileupstream, "wb") as f:
                    f.write(data1.encode())
        rc = 0
        rc = subprocess.call(['sudo', 'nginx', '-t', '-c', '/ms71/saas.conf', '-p', '/ms71/'])
                             #stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if 0 == rc:
            rc = subprocess.call(['sudo', 'nginx', '-s', 'reload', '-c', '/ms71/saas.conf', '-p', '/ms71/'])
            if 0 == rc:
                self.log("%s:%s running" % addr)
                return [addr, os.getpid()]
        raise SystemExit(rc)

    def _getfilename(self, name):
        filename = ""
        if self.index > -1:
            if self.profile:
                filename = os.path.join(sys.APPCONF["nginx"][name], "%s-%s.%s" % (self.appname, self.index, self.profile))
            else:
                filename = os.path.join(sys.APPCONF["nginx"][name], "%s-%s" % (self.appname, self.index))
        else:
            if self.profile:
                filename = os.path.join(sys.APPCONF["nginx"][name], "%s.%s" % (self.appname, self.profile))
            else:
                filename = os.path.join(sys.APPCONF["nginx"][name], self.appname)
        return filename

def head(aContentLength, fgDeflate=True, fg_head=True):
    """
    make a header of response function
    """

    aLastModified = time.strftime('%a, %d %b %Y %X GMT', time.gmtime())
    r = []
    r.append(("Last-Modified", "%s" % aLastModified))
    r.append(("Content-Length", "%i" % aContentLength))
    r.append(("X-Accel-Buffering", "no"))
    if fg_head:
        r.append(("Content-Type", "application/json"))
    else:
        r.append(("Cache-Control", "no-cache"))
        r.append(("Content-Type", "text/plain; charset=UTF-8"))
    if fgDeflate:
        r.append(("Content-Encoding", "deflate"))
    return r

def shutdown(log):
    """
    function, runs when exiting
    """

    fileupstream = sys.APPCONF.get("fileupstream")
    if fileupstream is None:
        log("%s:%s critical" % sys.APPCONF["addr"], begin='')
        return
    try:
        os.remove(fileupstream)
    except: pass
    dn = os.path.dirname(fileupstream)
    bs = os.path.basename(fileupstream)
    _fileupstream = os.path.join(dn, bs.split('.', 1)[0].split('-', 1)[0])
    _fileupstreamlock = bs.split('.', 1)[0].split('-', 1)[0]
    with LockWait(_fileupstreamlock):
        _find = "# %s" % bs
        src = ""
        fg_noapp = True
        if os.path.exists(_fileupstream):
            with open(_fileupstream, "rb") as f:
                src = f.read().decode().rstrip().splitlines()
            for i in range(1, len(src)-1):
                if src[i].find(_find) >-1:
                    src.pop(i)
                    break
            fg_noapp = 0 == len(src[2:-1])
        if fg_noapp:  # нет запущенных приложений, удаляем общую локацию и апстрим
            try:
                os.remove(sys.APPCONF["filelocation"])
            except: pass
            try:
                os.remove(_fileupstream)
            except: pass
        else:
            src = '\n'.join(src)
            with open(_fileupstream, "wb") as f:
                f.write(src.encode())

    subprocess.call(['sudo', 'nginx', '-s', 'reload', '-c', '/ms71/saas.conf', '-p', '/ms71/'])
    log("%s:%s shutdown" % sys.APPCONF["addr"], begin='')

def _int(x):
    try:
        fx = float(x)
        ix = int(fx)
        return ix if ix == fx else fx
    except:
        return x

def parse_args(arg, _param, x_hash, api):
    try:
        call = getattr(api, arg)
    except:
        content = json.dumps({"result": False, "ret_val": u'\'%s\' not implimented method'} % arg, ensure_ascii=False)
    else:
        if x_hash:
            try:
                content = call(_param, x_hash)
            except:
                res = {"result": False, "ret_val": "error in method '%s'" % arg}
                #content = json.dumps(u'use \'%s\' with correct parameters' % arg, ensure_ascii=False)
                content = json.dumps(res, ensure_ascii=False)
        else:
            content = json.dumps({"result": False, "ret_val": "login please"}, ensure_ascii=False)
    return content

def handle_commandline(profile, index):
    args = []
    kwargs = {}
    sys.stdin.close()
    _argv = sys.argv[1:]
    for x in _argv:
        i = x.find('=')
        if i > -1:
            k, x  = x[:i], x[i+1:]
        else:
            k = None
        if k:
            v = unquote(x).split(',')
            if len(v) > 1:
                kwargs[unquote(k)] = tuple(_int(x) for x in v)
            else:
                kwargs[unquote(k)] = _int(v[0])
        else:
            if x:
                v = unquote(x).split(',')
                if len(v) > 1:
                    args.append(tuple(libs._int(x) for x in v))
                else:
                    args.append(_int(v[0]))
    if "profile" in kwargs:
        profile = kwargs.pop("profile")
    if "index" in kwargs:
        index = kwargs.pop("index")
    return args, kwargs, profile, index

def monitor(api):
    inw_dir = api.inw_path
    connection = api.connect_params
    while True:
        try:
            sql = "select r.uin from PRC_TASKS r"
            db = fdb.connect(**connection)
            dbc = db.cursor()
            dbc.execute(sql)
            result = dbc.fetchall()
            for row in result:
                uin = row[0]
                sql = f"""SELECT CASE 
        WHEN not EXISTS(select uin from PRC where uin = '{uin}' and n_fg != 1) THEN 0
        ELSE 1
        END
    FROM RDB$DATABASE"""
                dbc.execute(sql)
                res = dbc.fetchone()
                #print(uin, res)
                if int(res[0]) == 0:
                    sql = f"""delete from PRC_TASKS where uin = '{uin}' returning callback"""
                    dbc.execute(sql)
                    callback = dbc.fetchone()[0]
                    db.commit()

                    print("form the message")
                    print(f"send message to {callback or 'source'}")
                    try:
                        os.remove(os.path.join(inw_dir, uin))
                    except:
                        api.log(traceback.format_exc(), kind="error:removing")
                else:
                    continue
            db.close()
        except Exception as Err:
            api.log(traceback.format_exc(), kind="error:monitor")
        time.sleep(60)

def guardian(api):
    work_dir = api.path
    log = api.log
    connection = api.connect_params
    while True:
        try:
            f_mask = os.path.join(work_dir, "*")
            for path in glob.glob(f_mask):
                if os.path.isdir(path):
                    continue
                row = None
                log(f"path: {path}")
                with open(path, 'rb') as f_obj:
                    row = f_obj.readline()
                if row:
                    db = fdb.connect(**connection)
                    dbc = db.cursor()
                    row = row.decode('utf8')
                    id_vnd = int(row.split('\t')[0])
                    if id_vnd:
                        #если есть id_vnd, то проверяем его наличие в базе, если его нет - добавляем
                        vnd_name = api.getNameByCode(id_vnd)
                    sql = f"""SELECT count(*) FROM LNK_CODES r where r.PROCESS = 1 and r.CODE = {id_vnd}"""
                    dbc.execute(sql)
                    h_name = os.path.basename(path)
                    h_name, source = h_name.split('.')
                    if not list(dbc.fetchone())[0]:# and int(source) != 2:
                        log('- пропускаем, сведение не разрешено')
                        #переносим файл в несводимые, делаем запись в базе о том, что сведение не разрешено
                        sql = f"""delete from PRC_TASKS where uin = '{h_name}'"""
                        dbc.execute(sql)
                        db.commit()
                        shutil.move(path, os.path.join(api.p_path, h_name))
                        continue
                    else:
                        log('- начинаем сведение')
                        count_insert = 0
                        count_all = 0
                        count_insert, count_all = api.upload_to_db(db, dbc, id_vnd, path, count_insert, count_all, int(source))
                        log("- удаляем файл:")
                        try:
                            shutil.move(path, os.path.join(api.inw_path, h_name))
                            #os.remove(path)
                            log("[ OK ]")
                        except Exception as e:
                            log("[FAIL]")
                            log(str(e), kind="error")
                        if count_insert > 0:
                            api.prc_sync_lnk(db, dbc, h_name)
                            sql = f"""select count(*) from PRC r where r.n_fg != 1 and r.UIN = '{h_name}'"""
                            dbc.execute(sql)
                            count_insert = dbc.fetchone()[0]
                    api.log(f'Добавленно к сведению: {count_insert}')
                    db.close()
        except Exception as Err:
            api.log(traceback.format_exc(), kind="error:monitor")
        #спим 5 секунд перед тем, как продолжить опрос папки
        time.sleep(5) 

class UDPSocket(socket.socket):

    def __init__(self, bind_addr=('127.0.0.1', 0), std_addr=('127.0.0.1', 4222),
                 family=socket.AF_INET, type=socket.SOCK_DGRAM, proto=0, _sock=None):
        super(UDPSocket, self).__init__(family=family, type=type, proto=proto)
        try: self.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        except: pass
        try: self.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
        except: pass
        self.bind(bind_addr)
        self._buf = []
        self._std_addr = std_addr

    def write(self, text):
        fg = False
        if isinstance(text, str):
            self._buf.append(text.encode())
            fg = text.rfind('\n') > -1
        else:
            self._buf.append(text)
            fg =  text.rfind(b'\n') > -1
        if fg:
            data = b''.join(self._buf)[:8192]
            self._buf.clear()
            return self.sendto(data, self._std_addr)

    def flush(self):
        pass

    def readlines(self):
        return self.recv(8192)

    def read(self, n=8192):
        return self.recv(n)


