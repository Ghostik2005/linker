#!/usr/bin/python
# -*- coding: utf-8 -*-

import sys
reload(sys)
sys.setdefaultencoding('utf8')

import os
import json
import logging

import connect
##from dbsync import *
#from tovar import *
#from spr import *


LOG_FILENAME = 'worklog.out'
logging.basicConfig(filename=LOG_FILENAME,level=logging.DEBUG)

ccode1 = "utf8"
ccode = "cp1251"

class Loging:
    def add(self, task, result, error, user):
        import datetime
        
        logging.debug('\n\n')
        logging.debug(user + ' - ' + str(datetime.datetime.now()) )
        logging.debug('\ttask: ' + task)
        logging.debug('\tresult: ' + str(result))
        logging.debug('\terror: ' + str(error))

class Worker:
    start = 0
    limit = 25
    task = ''    
    user = ''
    query = ''
    action = ''
    db = connect.conMySpr()
    PATH = "/var/www/htdocs/app/brak/brak/"
    PATHIMP = "/var/www/htdocs/app/brak/imp/"
    
    def fileUpload(self):
        import shutil
        try:
            impfile = self.action
            with open(self.PATHIMP + impfile['impfile'].filename, 'wb') as saved:                    
                shutil.copyfileobj(impfile['impfile'].file, saved) 
            return json.dumps( { "success": True}, ensure_ascii=False ).encode(ccode1)
        except Exception, e:
            return e
    
    def getFilter(self):
        
        tmpArr = self.action.split('+')        
        if len(tmpArr) == 1: tmpArr.append('')
        
        try:
            db = self.db
            dbc = db.cursor()        
            
            sql = """select t1.sh_prc, t1.id_spr, t1.c_tovar, t1.c_zavod, t2.series, t2.RAZBRAK from lnk t1
                inner join brak t2 on ( t1.sh_prc = t2.sh_prc and upper(t2.series) like upper('%s') )
                where t1.id_vnd = 10000 and upper(t1.c_tovar) like upper('%s')""" % ( "%" + tmpArr[1] + "%", "%" + tmpArr[0] + "%" )
            #print sql
            dbc.execute(sql)
            f = dbc.fetchall()                        
            return json.dumps( { "req":"%s" % sql, "success": True, "results":f }, ensure_ascii=False ).encode(ccode1)
        except  Exception, e:
            #Loging.add( task, str(e), self.user)
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    
    def changeZarbrak(self):
        tmpArr = self.action.split(',')
        try:
            db = self.db
            dbc = db.cursor()  
            sql = """update BRAK set RAZBRAK = %s where sh_prc = '%s' and series = '%s' """ % ( '1' if tmpArr[2] == 'true' else '0', tmpArr[0], tmpArr[1])                        
            #item.sh_prc + ',' + item.series + ',' + checked  
            dbc.execute(sql)
            db.commit()
        
            return json.dumps( { "req":"%s" % sql, "success": True, "results": True }, ensure_ascii=False ).encode(ccode1)
        except  Exception, e:
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    def getMail(self):
        try:
            db = self.db
            dbc = db.cursor()        
            action = json.loads(self.action)['mass']
            sql = """select r.sh_prc, r.title, r.title_torg, r.seriya, r.fabricator, r.region, r.n_rec, r.dt_edit, r.gv, r.title_doc, r.opis, r.link_file, r.id,
CASE 
    WHEN bmt.MAIL_TEXT is null THEN ''
    ELSE bmt.MAIL_TEXT
END as m_text
from brak_mail  r
LEFT JOIN BRAK_MAIL_TEXT bmt on bmt.LINK_FILE = r.LINK_FILE
where r.sh_prc = '%s' and r.seriya = '%s' """ % ( action[1], action[0] )
            
            dbc.execute(sql)
            f = dbc.fetchall()
            result = []                        
            
            for rec in f:
                res = {}
                res["sh_prc"]     =  rec[0] 
                res["title"]      =  rec[1] 
                res["title_torg"] =  rec[2] 
                res["seriya"]     =  rec[3] 
                res["fabricator"] =  rec[4] 
                res["region"]     =  rec[5] 
                res["n_rec"]      =  rec[6] 
                res["dt_edit"]    =  rec[7] 
                res["gv"]         =  rec[8] 
                res["title_doc"]  =  rec[9] 
                res["opis"]       =  rec[10]
                res["link_file"]  =  rec[11]
                res["id"]  =  rec[12]

                res["doc_text"] = rec[13].decode("UTF8")
                
                #f = open('%s%s.txt' % ( self.PATH, res["link_file"] ) )
                #res["doc_text"] = f.read()                
                #f.close()
            
                result.append(res)
            
            return json.dumps( { "req":"%s" % self.task, "success": True, "results":result }, ensure_ascii=False ).encode(ccode1)
        except  Exception, e:
            #Loging.add( task, str(e), self.user)
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    def saveMail(self):
        import uuid
        try:
            action = json.loads(self.action)['mass']
            if action[12] == None:
                uid = str(uuid.uuid1())
            else:
                uid = action[12]
            db = self.db
            dbc = db.cursor()        
            
            if action[12] == None:
                sql = """insert into BRAK_MAIL (title, title_torg, seriya, fabricator, region, n_rec, dt_edit, gv, title_doc, opis, sh_prc, link_file ) 
                values ('%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s', '%s') """ % ( action[0], action[1], action[2], action[3], action[4], action[5], action[6], action[7], action[8], action[9], action[11], uid )
            else:
                sql = """update BRAK_MAIL set title = '%s', title_torg = '%s', seriya = '%s', fabricator = '%s', region = '%s', 
                n_rec = '%s', dt_edit = '%s', gv = '%s', title_doc = '%s', opis = '%s', sh_prc = '%s', link_file = '%s' 
                where id = %s """ % ( action[0], action[1], action[2], action[3], action[4], action[5], action[6], action[7], action[8], action[9], action[11], uid, action[13] )                        
            sql1 = """UPDATE OR insert into BRAK_MAIL_TEXT (LINK_FILE, MAIL_TEXT)
values ('%s', '%s')""" % (uid, action[10].encode('UTF8')) 
            dbc.execute(sql)
            db.commit()
            
            f = open('%s%s.txt' % ( self.PATH, uid ), 'w')
            f.write(action[10] + '\n')
            f.close()
           
            
            return json.dumps( { "req":"%s" % sql, "success": uid , "results":True }, ensure_ascii=False ).encode(ccode1)
        except  Exception, e:
            #Loging.add( task, str(e), self.user)
            #print sql
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
    def delMail(self):          
        try:
            db = self.db
            dbc = db.cursor()                    
            sql = """delete from brak_mail where id = %s""" % ( self.action )            
            dbc.execute(sql)
            db.commit()
            
            return json.dumps( { "req":"%s" % sql, "success": True, "results":True }, ensure_ascii=False ).encode(ccode1)
        except  Exception, e:            
            return json.dumps({"req":"%s" % sql, "results":"false", "error":'Ошибка: %s' % e}, ensure_ascii=False).encode(ccode1)
    
if __name__ == "__main__":
    Worker = Worker()
    Worker.action = u"""{"mass":["\u041d\u0430\u0442\u0440\u0438\u044f \u0445\u043b\u043e\u0440\u0438\u0434, \u0440-\u0440 \u0434\u043b\u044f \u0438\u043d\u044a\u0435\u043a. 0,9% 410 \u043c\u043b, \u0431\u0443\u0442\u044b\u043b\u043a\u0438 \u0441\u0442\u0435\u043a\u043b.","\u041d\u0430\u0442\u0440\u0438\u044f \u0445\u043b\u043e\u0440\u0438\u0434, \u0440-\u0440 \u0434\u043b\u044f \u0438\u043d\u044a\u0435\u043a. 0,9% 410 \u043c\u043b, \u0431\u0443\u0442\u044b\u043b\u043a\u0438 \u0441\u0442\u0435\u043a\u043b.","AN.758/760","\u041d\u0423\u0417 \"\u0414\u041a\u0411 \u043d\u0430 \u0441\u0442\u0430\u043d\u0446\u0438\u0438 \u0425\u0430\u0431\u0430\u0440\u043e\u0432\u0441\u043a-1\"","1","2","2014-10-17T00:00:00","4","\u041d\u043e\u0432\u044b\u0439 \u0434\u043e\u043a\u0443\u043c\u0435\u043d\u0442","5454","wrfwerwefr","90d69c786a5ecd60bae09acfac12b164",null]}"""
    print Worker.saveMail()
    
