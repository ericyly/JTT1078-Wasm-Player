# 1078 部标音视频浏览器直播方案

```
PC浏览器播放效果图（ 20 / 40 路)
```

```
手机浏览器播放效果图（ 8 路）

```
## 一、演示系统使用说明

```
1.解压文件后，鼠标双击jts-svr.exe程序即可启动演示系统。看到控制台输出：jts-svr listening on: 0. 0. 0. 0 : 8088 ...，表明启动成功。
```
```
2.本机浏览器中输入(或鼠标点击此链接)： 127.0.0.1:8088 ，回车即可看到演示系统页面，点击「start/开始」按钮开始播放，点击「stop/停止」停止播放。两个输入框表示期望演示视频通路的行列数，改变后，点击「start/开始」，即可看到所设定行列数积的视频通路，演示系统一般会随机打开某一路的声音，可点击「playaudio/声音开关」复选框关闭或打开声音。局域网中其他主机访问，可在浏览器中输入演示系统主机的实际IP地址和端口即可访问，如： 192. 168 .*.*: 8088 。
```
```
3.可流畅播放视频总路数，取决于运行浏览器电脑/手机的性能，主要性能指标为CPU和内存。普通电脑可流畅播放12路以上。谷歌浏览器中20/40 路视频同时播放的截图，其视频格式为H264 ，帧率为每秒15帧，音频格式为AAC，媒体流为交通部JT/T1078 标准格式。
```
```
4.测试系统以JT/T1078 标准数据包格式封装的媒体文件为基础，模拟演示不同通路的视频，各通路视频显示随机跳过一定时间，视频首帧黄色字体显示数字即为跳过时间，由于服务端首先需要随机跳过一些视频帧，稍有时间消耗，因此各通路视频显示略有延迟。由于媒体流
来自同一份视频数据，故各通路视频显示内容总体一致，播放时间上有先后。
```
## 二、方案适用场景

```
1.浏览器无插件JT/T 1078 媒体流直播。无插件和客户端安装麻烦及兼容性问题，既不需要特定版本浏览器支持插件(如已被废弃的flash插件)，也不需要使用视频客户端软件结合浏览器页面应用才可提供全部应用功能。便于在浏览器中为用户提供单一的融合业务功能、音视频功能的H5 页面应用。本演示系统即为在浏览器中直接解包、解码和播放JT/T 1078 行业标准媒体流。
```
```
2.支持更多媒体格式。H5 的video元素支持媒体格式有MP4 、OGG、WebM，媒体封包、编码格式支持数量有限，视频不支持H265 格式，音频不支持部标常用的G.722/723 等。本技术方案基于ffmpeg、wasm可支持更多的封包、编码格式，如H265、G.7xx等ffmpeg支持的全系音视频格式、封装格式及自定义封装格式（如：交通部JT/T 1078 等即为行业标准定义的RTP媒体封包）。
```
```
3.更高性能多路视频播放。在浏览器中通过wasm技术提升解包、解码效率，无常规javascript运行低效之虞；通过web worker多线程技术应用，充分发挥客用户端电脑多核运算能力；同时通过Canvas显示视频画面，提升浏览器画面显示效率；从而实现多路视频并行播放，提高视频播放实用性和用户体验。超越原生H5的video元素主要为满足个人用户视频观看需求，满足业务应用中多视频同时播放的情形。
```
```
4.支持PC端谷歌浏览器、Edge浏览器等；手机端华为浏览器、Edge浏览器等。以上图示即为响应浏览器视频播放截图，视频帧率为24 。
```
## 三、技术方案特色

```
1.浏览器和视频服务器之间通过websocket实时交换数据，浏览器发出媒体数据请求，然后服务端把行业标准媒体流(交通部部标JT/T1078视频流)发送到浏览器端，浏览器端自行解码播放。浏览器-->http请求-->视频服务器(http请求处理及http升级为web socket)-->rtp
over web socket-->浏览器(拆包、解码、播放)。浏览器中由线程工作者(decoder_worker.js)驱动(stream_decoder.js)拆包、解码，并由播放器(jts_player.js)显示画面、播放声音。本演示系统为方便演示将视频服务器、web服务器合二为一，单一服务同时提供演示所需web请求服务和视频流服务。
```
```
2.方案支持任意音视频编解码类型，前端代码简洁高效，性能卓越，可针对应用场景所需的编解码发布不同支持版本，否则wasm文件较大、下载慢导致用户体验差。在浏览器端进行拆包、解码，大大降低视频服务器计算资源需求，仅转发音视频数据即可，不需要拆包、转码、
封包为浏览器支持的特定格式。
```
```
3.只要浏览器支持H5 标准、wasm执行引擎，无论浏览器种类、手机端还是PC端，均可实现音视频播放。不同浏览器需要不同优化的播放器发布版本，以最大化播放效果、最小化浏览器资源消耗。
```
```
4.通过浏览器端主机性能充分应用，和服务器端媒体数据无转换延迟直接转发，用户将获得更佳使用体验，一方面音视频响应更快，另一方面可同时观看多路音视频播放。
```
```
5.在现有前端代码基础上，基于标准Web API可很方便自行实现视频全屏、拍照、录像等功能，相关API见：CanvasAPI、MediaStreamAPI。
```
## 四、问题及解决

```
1.由于演示系统缓存html、js文件，因此html、js文件内容的修改，须重启服务系统才可看到修改效果，并可能需要自行清除浏览器缓存。
```
## 五、 1078 媒体流说明

```
1.jiupin-352-288-time-15-audio.rtp为模拟JT/T 1078 部标的音视频流文件，演示系统读取文件内容，通过网络传输到浏览器端，浏览器端直接解码播放，浏览器上每一个播放媒体流代表一路车载监控音视频。
```
```
2.上图为jiupin-352-288-time-15-audio.rtp媒体流文件的 16 进制显示。每个以 30316364 开始的数据段即为一个JT/T 1078 部标音视频数据包，数据包格式见部标文件5.5.3节码流数据报文定义。
```