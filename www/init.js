function getNginxConfTemp(name) {
  let temp = `
server {                                                                        
    listen       80;                                           
    server_name  ${name}.mmler.cn;                                                 							 

    location / {
        root   /usr/share/nginx/html/${name};
        try_files   $uri $uri/ /index.php?$args;
        index  index.html index.htm index.php;
    }

    location ~ \\.php$ {
        root   /var/www/html/${name};
        fastcgi_pass   php:9000;
        fastcgi_index  index.php;
        fastcgi_split_path_info  ^((?U).+\\.php)(/?.+)$;
        fastcgi_param  SCRIPT_FILENAME  $document_root$fastcgi_script_name;
        fastcgi_param  PATH_INFO  $fastcgi_path_info;
        fastcgi_param  PATH_TRANSLATED  $document_root$fastcgi_path_info;
        include        fastcgi_params;
    }
}
  `.trim();

  return temp;
}

function getWordpressConfTemp(name) {
  let temp = `
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
define('DB_NAME', '${name}');

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
define('SECURE_AUTH_KEY',  'WQ6P8+T]gS8JpEVD-8}9mn\`FVz+Aw(,X|XRl/S*n&eA!}fr[y092V}j{#&X4})ED');
define('LOGGED_IN_KEY',    'WOi={\`?eM*$*oPi=9FkAQ13DMwjT,}ip6+a|=c8FyzXAPWb8jMKA3fjoQz~,L72d');
define('NONCE_KEY',        '~#urPhS0N(K5pQqZWz-Z MDj-a:A*aD9Td[:oS n!(R^EiKOg0YuLi8/4c$#?kj:');
define('AUTH_SALT',        'Pu!a*SEBM(UH^l2VMt*FK)O]G|9/b~ZC&ohkCzcacUC3,I(t|cbr6G+2hOraO~4Y');
define('SECURE_AUTH_SALT', 'mH1@x\`mw-!NQ({t{Kl?kOe}![wR31\`$se55uyMrPJ:sEbyAPIjuPi-|N?.vH-~~\`');
define('LOGGED_IN_SALT',   'zEvb}+Sdd{}B9(EU0+QXONu@ 3W-VlABrp8YUj4\`/DNYoC4-M8B3JJsaVYEF_3O=');
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
  `.trim();

  return temp;
}

function appendHosts(name) {
  let domain = `${name}.mmler.cn`;
  let hostRoot = 'C:/Windows/System32/drivers/etc/hosts';
  let appendContent = `\n127.0.0.1 ${domain}`;
  
  fs.appendFile(hostRoot, appendContent, function(err) {
    let msg = err || `${domain} append hosts success`;
    console.log(msg);
  });
}

function addNginxConf(name) {
  let confName = `${name}.conf`;
  let configRoot = path.resolve(__dirname, '../nginx/conf/vhosts/', confName);
  let confContent = getNginxConfTemp(name);
  
  fs.writeFile(configRoot, confContent, function(err) {
    let msg = err || `${confName} add success`;
    console.log(msg);
  });
}

function addWordpressConf(name) {
  let confName = 'wp-config.php';
  let configRoot = path.resolve('.', confName);
  let confContent = getWordpressConfTemp(name);
  
  fs.writeFile(configRoot, confContent, function(err) {
    let msg = err || `${confName} add success`;
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