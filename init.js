function getRealDirRoot(dirName) {
  let ArrDirName = dirName.split(path.sep);
  let realDirRoot = ArrDirName.reduce(function(root, dir) {
    let nextRoot = root + path.sep + dir;
    if (!fs.existsSync(nextRoot)) {
      fs.mkdirSync(nextRoot);
    }
    return nextRoot;
  });

  return realDirRoot;
}

function getRealFileRoot(fileRoot) {
  let dirRoot = path.dirname(fileRoot);
  let fileName = fileRoot.split(path.sep).pop();
  let realDirRoot = getRealDirRoot(dirRoot);

  return path.resolve(realDirRoot, fileName);
}

function addFile(fileRoot, fileContent) {
  try {
    let realFileRoot = getRealFileRoot(fileRoot);
    fs.writeFile(realFileRoot, fileContent, function(err) {
      let msg = err || `${realFileRoot} add success`;
      console.log(msg);
    });
  } catch (err) {
    console.error(err);
  }
}

function addNginx(root) {
  let logsRoot = path.resolve(root, 'nginx/logs');
  getRealDirRoot(logsRoot);

  let nginxConfRoot = path.resolve(root, 'nginx/conf/nginx.conf');
  let nginxConfContent = `
user  nginx;                                                                 
worker_processes  1;                                                         

error_log  /var/log/nginx/error.log warn;                                    
pid        /var/run/nginx.pid;                                               

events {
    use epoll;	
    worker_connections  1024;                                                
}                                                                            

http {                                                                       
    include       /etc/nginx/mime.types;                                     
    default_type  application/octet-stream;                                  

    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '            
                      '"$http_user_agent" "$http_x_forwarded_for"';          

    access_log  /var/log/nginx/access.log  main;                             

    sendfile        on;                                                      
    #tcp_nopush     on;                                                      

    keepalive_timeout  65;                                                   

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;                                        
}  
  `.trim();
  addFile(nginxConfRoot, nginxConfContent);

  let defaultConfRoot = path.resolve(root, 'nginx/conf/vhosts/default.conf');
  let defaultConfContent = `
server {                                                                        
    listen       80;                                                         
    server_name  localhost;                                                

    #charset koi8-r;                                                         
    #access_log  /var/log/nginx/host.access.log  main;                       

    location / {                                                             
        root   /usr/share/nginx/html;                                        
        index  index.html index.htm;                                         
    }                                                                        

    #error_page  404              /404.html;                                 

    # redirect server error pages to the static page /50x.html               
    #                                                                        
    error_page   500 502 503 504  /50x.html;                                 
    location = /50x.html {                                                   
        root   /usr/share/nginx/html;                                        
    }                                                                        

    # proxy the PHP scripts to Apache listening on 127.0.0.1:80              
    #                                                                        
    #location ~ \.php$ {                                                     
    #    proxy_pass   http://127.0.0.1;                                      
    #}                                                                       

    # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000     
    #                                                                        
    #location ~ \.php$ {                                                     
    #    root           html;                                                
    #    fastcgi_pass   127.0.0.1:9000;                                      
    #    fastcgi_index  index.php;                                           
    #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;       
    #    include        fastcgi_params;                                      
    #}                                                                       

    # deny access to .htaccess files, if Apache's document root              
    # concurs with nginx's one                                               
    #                                                                        
    #location ~ /\.ht {                                                      
    #    deny  all;                                                          
    #}                                                                       
}                                                                            
  `.trim();
  addFile(defaultConfRoot, defaultConfContent);
}

function addPHP(root) {
  let dir = path.resolve(root, 'php');
  let fileRoot = path.resolve(dir, 'Dockerfile');
  let fileContent = `
FROM php:7.3.7-fpm
RUN docker-php-ext-install mysqli
  `.trim();
  addFile(fileRoot, fileContent);
}

function addWWW(root) {
  let initJsRoot = path.resolve(root, 'www/init.js');
  let initJsContent = `
function getNginxConfTemp(name) {
  let temp = \`
server {                                                                        
    listen       80;                                           
    server_name  \${name}.mmler.cn;                                                 							 

    location / {
        root   /usr/share/nginx/html/\${name};
        try_files   $uri $uri/ /index.php?$args;
        index  index.html index.htm index.php;
    }

    location ~ \\\\.php$ {
        root   /var/www/html/\${name};
        fastcgi_pass   php:9000;
        fastcgi_index  index.php;
        fastcgi_split_path_info  ^((?U).+\\\\.php)(/?.+)$;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        fastcgi_param  PATH_INFO  $fastcgi_path_info;
        fastcgi_param  PATH_TRANSLATED  $document_root$fastcgi_path_info;
        include        fastcgi_params;
    }
}
  \`.trim();

  return temp;
}

function getWordpressConfTemp(name) {
  let temp = \`
<?php
/**
 * The base configuration for WordPress
 *
 * The wp-config.php creation script uses this file during the
 * installation. You don't have to use the web site, you can
 * copy this file to "wp-config.php" and fill in the values.
 *
 * This file contains the following configurations:
 *
 * * MySQL settings
 * * Secret keys
 * * Database table prefix
 * * ABSPATH
 *
 * @link https://codex.wordpress.org/Editing_wp-config.php
 *
 * @package WordPress
 */

// ** MySQL settings - You can get this info from your web host ** //
/** The name of the database for WordPress */
define('DB_NAME', '\${name}');

/** MySQL database username */
define('DB_USER', 'root');

/** MySQL database password */
define('DB_PASSWORD', 'mmlrocks10000');

/** MySQL hostname */
define('DB_HOST', '120.76.61.245');

/** Database Charset to use in creating database tables. */
define('DB_CHARSET', 'utf8mb4');

/** The Database Collate type. Don't change this if in doubt. */
define('DB_COLLATE', '');

/**#@+
 * Authentication Unique Keys and Salts.
 *
 * Change these to different unique phrases!
 * You can generate these using the {@link https://api.wordpress.org/secret-key/1.1/salt/ WordPress.org secret-key service}
 * You can change these at any point in time to invalidate all existing cookies. This will force all users to have to log in again.
 *
 * @since 2.6.0
 */
define('AUTH_KEY',         'q!&E#4^xy0,bZJx=6;}wZ#tHo~3c:{kcyijtEKfJy2u&Kr#)9YGC9L,^#uvaS]Lc');
define('SECURE_AUTH_KEY',  'WQ6P8+T]gS8JpEVD-8}9mn\\\`FVz+Aw(,X|XRl/S*n&eA!}fr[y092V}j{#&X4})ED');
define('LOGGED_IN_KEY',    'WOi={\\\`?eM*$*oPi=9FkAQ13DMwjT,}ip6+a|=c8FyzXAPWb8jMKA3fjoQz~,L72d');
define('NONCE_KEY',        '~#urPhS0N(K5pQqZWz-Z MDj-a:A*aD9Td[:oS n!(R^EiKOg0YuLi8/4c$#?kj:');
define('AUTH_SALT',        'Pu!a*SEBM(UH^l2VMt*FK)O]G|9/b~ZC&ohkCzcacUC3,I(t|cbr6G+2hOraO~4Y');
define('SECURE_AUTH_SALT', 'mH1@x\\\`mw-!NQ({t{Kl?kOe}![wR31\\\`$se55uyMrPJ:sEbyAPIjuPi-|N?.vH-~~\\\`');
define('LOGGED_IN_SALT',   'zEvb}+Sdd{}B9(EU0+QXONu@ 3W-VlABrp8YUj4\\\`/DNYoC4-M8B3JJsaVYEF_3O=');
define('NONCE_SALT',       'u}ddd$,1K;T}Em1*tP@W?(d e;1U47Ew}J:s -PGtBt?9xi]Z0Fj/r=IkWGGa;6B');

/**#@-*/

/**
 * WordPress Database Table prefix.
 *
 * You can have multiple installations in one database if you give each
 * a unique prefix. Only numbers, letters, and underscores please!
 */
$table_prefix  = 'wp_';

/**
 * For developers: WordPress debugging mode.
 *
 * Change this to true to enable the display of notices during development.
 * It is strongly recommended that plugin and theme developers use WP_DEBUG
 * in their development environments.
 *
 * For information on other constants that can be used for debugging,
 * visit the Codex.
 *
 * @link https://codex.wordpress.org/Debugging_in_WordPress
 */
define('WP_DEBUG', true);

/* That's all, stop editing! Happy blogging. */

/** Absolute path to the WordPress directory. */
if ( !defined('ABSPATH') )
    define('ABSPATH', dirname(__FILE__) . '/');

/** Sets up WordPress vars and included files. */
require_once(ABSPATH . 'wp-settings.php');
  \`.trim();

  return temp;
}

function appendHosts(name) {
  let domain = \`\${name}.mmler.cn\`;
  let hostRoot = 'C:/Windows/System32/drivers/etc/hosts';
  let appendContent = \`\\n127.0.0.1 \${domain}\`;
  
  fs.appendFile(hostRoot, appendContent, function(err) {
    let msg = err || \`\${domain} append hosts success\`;
    console.log(msg);
  });
}

function addNginxConf(name) {
  let confName = \`\${name}.conf\`;
  let configRoot = path.resolve(__dirname, '../nginx/conf/vhosts/', confName);
  let confContent = getNginxConfTemp(name);
  
  fs.writeFile(configRoot, confContent, function(err) {
    let msg = err || \`\${confName} add success\`;
    console.log(msg);
  });
}

function addWordpressConf(name) {
  let confName = 'wp-config.php';
  let configRoot = path.resolve('.', confName);
  let confContent = getWordpressConfTemp(name);
  
  fs.writeFile(configRoot, confContent, function(err) {
    let msg = err || \`\${confName} add success\`;
    console.log(msg);
  });
}

function init(name) {
  appendHosts(name);
  addNginxConf(name);
  addWordpressConf(name);
}

const fs = require('fs');
const path = require('path');

let projectName = process.argv[2] || process.cwd().split(path.sep).pop();
init(projectName);
  `.trim();
  addFile(initJsRoot, initJsContent);

  let indexHtmlRoot = path.resolve(root, 'www/index.html');
  let indexHtmlContent = `
<!DOCTYPE html>                                                                     
<html>                                                                              
<head>                                                                              
<title>Welcome to nginx!</title>                                                    
<style>                                                                             
    body {                                                                          
        width: 35em;                                                                
        margin: 0 auto;                                                             
        font-family: Tahoma, Verdana, Arial, sans-serif;                            
    }                                                                               
</style>                                                                            
</head>                                                                             
<body>                                                                              
<h1>Welcome to MML!</h1>                                                                                                                                       
</body>                                                                             
</html>
  `.trim();
  addFile(indexHtmlRoot, indexHtmlContent);

  let _50xHtmlRoot = path.resolve(root, 'www/50x.html');
  let _50xHtmlContent = `
<!DOCTYPE html>                                                                     
<html>                                                                              
<head>                                                                              
<title>Error</title>                                                                
<style>                                                                             
    body {                                                                          
        width: 35em;                                                                
        margin: 0 auto;                                                             
        font-family: Tahoma, Verdana, Arial, sans-serif;                            
    }                                                                               
</style>                                                                            
</head>                                                                             
<body>                                                                              
<h1>An error occurred.</h1>                                                         
<p>Sorry, the page you are looking for is currently unavailable.<br/>               
Please try again later.</p>                                                         
<p>If you are the system administrator of this resource then you should check       
the error log for details.</p>                                                      
<p><em>Faithfully yours, nginx.</em></p>                                            
</body>                                                                             
</html>                                                                             
  `.trim();
  addFile(_50xHtmlRoot, _50xHtmlContent);
}

function addDockerCompose(root) {
  let fileRoot = path.resolve(root, 'docker-compose.yml');
  let fileContent = `
version: '2'

services:
    web_server:
        image: nginx:1.17.2
        container_name: nginx
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - ./nginx/conf/vhosts:/etc/nginx/conf.d
            - ./nginx/conf/nginx.conf:/etc/nginx/nginx.conf
            - ./www:/usr/share/nginx/html
            - ./nginx/logs:/var/log/nginx
        networks:
            - web
            
    php:
        build: ./php
        image: php:mysql_connect
        container_name: php
        ports:
            - "9000:9000"
        volumes:
            - ./www:/var/www/html
        networks:
            - web
            
    # db_server:
    #     image: mysql:5.7.27
    #     container_name: mysql
    #     environment:
    #         MYSQL_ROOT_PASSWORD: mmlrocks10000
    #     ports:
    #         - "3306:3306"
    #     command: [
    #         '--character-set-server=utf8mb4',
    #         '--collation-server=utf8mb4_unicode_ci'
    #     ]  
    #     volumes:
    #         - ./mysql:/var/lib/mysql
    #     networks:
    #         - web
        
networks:
    web:
        driver: bridge
  `.trim();

  addFile(fileRoot, fileContent);
}

function init(root) {
  addNginx(root);
  addPHP(root);
  addWWW(root);
  addDockerCompose(root);
}

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname);
init(root);