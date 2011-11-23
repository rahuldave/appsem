###
Simple-minded configuration for the AstroExplorer server.
###

sp = '/semantic2/alpha'

config =
  SITEPREFIX: sp
  STATICPREFIX: "#{sp}/static"
  SOLRHOST: 'localhost'
  SOLRURL: '/solr'
  SOLRPORT: 8984
  SOLRPORT2: 8982
  ADSHOST: 'adsabs.harvard.edu'
  ADSURL: '/cgi-bin/insert_login/credentials/'
  TEMPLATEDIR: __dirname + '/static/ajax-solr/templates/'

exports.config = config


