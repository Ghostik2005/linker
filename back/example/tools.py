#!/usr/bin/python
# -*- coding: utf-8 -*-

import utils, sys, os
import cgi,urllib
import simplejson as json
import datetime

reload(sys)
sys.setdefaultencoding('utf8')

ccode1 = "utf8"
ccode = "cp1251"

class Tools:
	def setGroups(self):
		db = utils.conMySpr()
		dbc = db.cursor()
		sql = """SELECT id_spr, n_uslov, n_sezon, n_binding FROM spr"""
		print 212
		dbc.execute(sql)
		rec = dbc.fetchall()
		i=1
		for m in rec:
			if m[2] == 1:
				sql = "INSERT INTO GROUPS (cd_code, cd_group) VALUES ( %s, '%s') " % (m[0], 'ZakMedCtg.1360')
				print sql
				try:
					dbc.execute(sql)
				except:
					pass
			if m[2] == 2:
				sql =  "INSERT INTO GROUPS (cd_code, cd_group) VALUES ( %s, '%s') " % (m[0], 'ZakMedCtg.1361')
				try:
					dbc.execute(sql)
				except:
					pass
			if m[2] == 3:
				sql =  "INSERT INTO GROUPS (cd_code, cd_group) VALUES ( %s, '%s') " % (m[0], 'ms1')
				print sql
				try:
					dbc.execute(sql)
				except:
					pass
			if m[2] == 0:
				sql =  "INSERT INTO GROUPS (cd_code, cd_group) VALUES ( %s, '%s') " % (m[0], 'ms2')
				print sql
				try:
					dbc.execute(sql)
				except:
					pass
			if m[1] == 1:
				sql =  "INSERT INTO GROUPS (cd_code, cd_group) VALUES ( %s, '%s') " % (m[0], 'ZakMedCtg.1226')
				print sql
				try:
					dbc.execute(sql)
				except:
					pass
			if m[1] == 2:
				sql =  "INSERT INTO GROUPS (cd_code, cd_group) VALUES ( %s, '%s') " % (m[0], 'ZakMedCtg.1227')
				print sql
				try:
					dbc.execute(sql)
				except:
					pass
			if m[1] == 3:
				sql =  "INSERT INTO GROUPS (cd_code, cd_group) VALUES ( %s, '%s') " % (m[0], 'ZakMedCtg.1228')
				print sql
				try:
					dbc.execute(sql)
				except:
					pass
			if m[3] == 1:
				sql =  "INSERT INTO GROUPS (cd_code, cd_group) VALUES ( %s, '%s') " % (m[0], 'ZakMedCtg.15')
				print sql
				try:
					dbc.execute(sql)
				except:
					pass
			db.commit()
			i=i+1
			print i

vTools = Tools()
vTools = vTools.setGroups()