import './App.css';

import React from 'react'
import axios from 'axios'
import 'reset-css';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/stream-parser';
import { go } from '@codemirror/legacy-modes/mode/go';
import { shell } from '@codemirror/legacy-modes/mode/shell';
import { perl } from '@codemirror/legacy-modes/mode/perl';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { lua } from '@codemirror/legacy-modes/mode/lua';
import { swift } from '@codemirror/legacy-modes/mode/swift';
import { textile } from '@codemirror/legacy-modes/mode/textile';
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { php } from "@codemirror/lang-php";
import { rust } from '@codemirror/lang-rust';
import { java } from '@codemirror/lang-java';
import { javascript } from '@codemirror/lang-javascript';





import ReactLoading from "react-loading";

class App extends React.Component {

  state = {
    editorHeight: 500, // 编辑器高度，用于分隔条自动拖动
    isDrag: false, // 分隔栏，是否正在拖动
    prevPos: 0, // 记录上一个拖动事件的y坐标
    theme: 'dark', // 编辑器主题
    code: '', // 初始代码
    lang: 'c', // 默认语言
    stdin: '', // 标准输入内容
    stdout: '', // 标准输出
    stderr: '', // 标准错误输出
    tabIndex: 0, // 指定显示的选项卡 0:显示输出，1显示输入
    running: false, // 记录是否在运行代码
  }

  // 主题列表
  themes = ["dark", "light"]

  // 语言列表
  langs = [
    "rust",
    "c", "c89", "c99", "c11", "c17",
    "cpp", "cpp98", "cpp11", "cpp14", "cpp17", "cpp20", "cpp23",
    "java", "nasm", "golang",
    "python2", "python3",
    "php5", "php7", "php8",
    "nodejs", "shell", "swift", "ruby", "perl",
  ]

  langModes = {
    "c": cpp(),
    "c89": cpp(),
    "c99": cpp(),
    "c11": cpp(),
    "c17": cpp(),
    "cpp": cpp(),
    "cpp98": cpp(),
    "cpp11": cpp(),
    "cpp14": cpp(),
    "cpp17": cpp(),
    "cpp20": cpp(),
    "cpp23": cpp(),
    "rust": rust(),
    "java": java(),
    "nasm": StreamLanguage.define(textile),
    "golang": StreamLanguage.define(go),
    "php5": php(),
    "php7": php(),
    "php8": php(),
    "python2": python(),
    "python3": python(),
    "ruby": StreamLanguage.define(ruby),
    "shell": StreamLanguage.define(shell),
    "nodejs": javascript(),
    "perl": StreamLanguage.define(perl),
    "swift": StreamLanguage.define(swift)
  }

  constructor(props) {
    super();
    this.editerRef = React.createRef();
    this.resultRef = React.createRef();
  }

  componentDidMount() {
    const that = this
    // 禁止ctrl+s
    window.addEventListener('keydown', function (e) {
      if (e.keyCode === 83 && (navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        if (that.state.running) return;
        that.runCode(1)
      }
    })


    // 移动端textarea无法滚动问题
    window.addEventListener('touchmove', function (e) {
      let target = e.target
      if (target && target.tagName === 'TEXTAREA') {
        e.stopPropagation();
      }
    }, true)


    // 禁止手机浏览器下拉
    document.addEventListener('touchmove', function (ev) {
      ev.preventDefault();
    }, { passive: false });



    let defaultCode = `#include <stdio.h>

// 欢迎使用不学网(noxue.com)提供的在线编译器
// 快捷键 Ctrl+S 自动编译
// 代码会自动保存，打开浏览器依然存在
// 发现bug或者漏洞，欢迎在github提交给我，也可以微信告知我，感激不尽。
// 微信号:noxuecom
int main(){
  printf("做人如果没有梦想，那和咸鱼有什么分别！");
  return 0;
}
`

    let code = localStorage.getItem("noxue-code");
    this.setState({
      code: code ? code : defaultCode
    })

    let lang = localStorage.getItem("noxue-lang");
    let theme = localStorage.getItem("noxue-theme");

    if (lang) {
      this.setState({ lang })
    }
    if (theme) {
      this.setState({ theme })
    }
  }

  languageChange = (e) => {
    console.log(e.target.value)
    // 切换语言，清空代码和输入输出
    this.setState({ lang: e.target.value, stdin: "", stdout: "" });
    window.localStorage.setItem("noxue-lang", e.target.value);
  }
  themeChange = (e) => {
    console.log(e.target.value)
    this.setState({ theme: e.target.value });
    window.localStorage.setItem("noxue-theme", e.target.value);
  }

  codeChange = (value) => {
    console.log(value)
    this.setState({ code: value })
    window.localStorage.setItem("noxue-code", value);
  }

  stdinChange = (e) => {
    this.setState({ stdin: e.target.value })
  }

  runCode = (e) => {
    const that = this

    // 防止重复提交
    if (this.state.running) return;

    this.setState({ running: true });

    axios({
      method: 'post',
      url: process.env.NODE_ENV === "development" ? 'https://code.noxue.com/api/run' : '/api/run',

      data: {
        lang: this.state.lang,
        code: this.state.code,
        input: this.state.stdin,
      }
    }).then(function (response) {

      // 请求结束后，切换到输出界面，并清空输入内容
      that.setState({ running: false, tabIndex: 0, stdin: "" });

      const res = response.data;

      if (res.code !== 0) {
        that.setState({ stdout: res.msg, stderr: '' });
        return;
      }

      that.setState({
        stdout: res.data.stdout,
        stderr: res.data.stderr,
      })

    }).catch((e) => {
      console.log("请求出错:", e)
      that.setState({ running: false, stdout: "请求出错:" + e });
    });
  }

  // 鼠标按下时，设置为开始拖动
  tabsMouseDown = (e) => {
    console.log(this.editerRef.current.view.dom.clientHeight)
    console.log(this.resultRef.current.clientHeight)
    this.setState({ isDrag: true, prevPos: 0 })
  }

  // 鼠标移动时，如果已经开始拖动，那就根据鼠标上下的移动距离修改编辑器高度
  tabsMouseMove = (e) => {
    console.log("move:", e)
    if (this.state.isDrag) {

      // 为了兼容移动端和电脑端
      const screenY = e.screenY || e.touches[0].screenY;

      // 相同值不处理，因为没移动
      if (this.state.prevPos === screenY) return;

      // 如果初始值为0，需要先记录第一个值
      if (this.state.prevPos === 0) {
        this.setState({
          prevPos: screenY
        })
        return;
      }


      console.log(this.state.editorHeight, this.state.prevPos, screenY);

      // 处理后记录当前值，作为下次移动参考,同时改变编辑器大小
      this.setState({
        editorHeight: this.state.editorHeight + (screenY - this.state.prevPos),
        prevPos: screenY
      })
    }
  }

  // 鼠标松开时，停止拖动
  tabsMouseUp = (e) => {
    this.setState({ isDrag: false, prevPos: 0 })
  }


  render() {

    return (
      <div className="app"
        onMouseMove={this.tabsMouseMove}
        onMouseUp={this.tabsMouseUp}
        onTouchMove={this.tabsMouseMove}
        onTouchEnd={this.tabsMouseUp}
      >
        <div className="loading" style={{ display: this.state.running ? "block" : "none" }}>
          <ReactLoading className="ani" type="spinningBubbles" color="#fff" />
        </div>
        <div className='tool-bar'>
          <div className="links">
            <a href='https://noxue.com?code' target="noxue">不学网</a>
            <a href='https://github.com/noxue/noxue-code' target="code">本站源码</a>
          </div>
          <div className='theme'>
            <label>主题</label>
            <select value={this.state.theme} onChange={this.themeChange}>
              {this.themes.map((item, index) => {
                return (<option key={index} value={item}>{item}</option>)
              })}

            </select>
          </div>
          <div className='lang'>
            <label>语言</label>
            <select value={this.state.lang} onChange={this.languageChange}>
              {
                this.langs.map((item, index) => {
                  return (<option key={index} value={item}>{item}</option>)
                })
              }
            </select>
          </div>
        </div>

        <CodeMirror
          ref={this.editerRef}
          value={this.state.code}
          height={this.state.editorHeight + "px"}
          width='100%'
          theme={this.state.theme}
          extensions={[this.langModes[this.state.lang]]}
          onChange={this.codeChange}
        />

        {/* 高度根据编辑器高度自动计算，这样只要修改编辑器高度就可以实现分割条的自由拖动 */}
        <div className='result' ref={this.resultRef} style={{ height: "calc(100vh - " + (this.state.editorHeight + 41) + "px)" }}>

          <div className='tabs' onMouseDown={this.tabsMouseDown} onTouchStart={this.tabsMouseDown} style={{ cursor: this.state.isDrag ? "grab" : "" }}>
            <div onClick={(e) => {
              this.setState({ tabIndex: 0 })
            }}>标准输出</div>
            <div onClick={(e) => {
              this.setState({ tabIndex: 1 })
            }}>输入</div>
            <div onClick={this.runCode} className='run-code'>运行</div>
          </div>
          {
            this.state.tabIndex === 1 ? (
              <div className='stdin'>
                <textarea placeholder='请输入运行程序时需要输入的内容' value={this.state.stdin} onChange={this.stdinChange} />
              </div>
            ) : (
              <div className='stdout'>
                <textarea placeholder='还未运行程序，请点击【运行】按钮执行程序' value={this.state.stdout + "\n\n" + this.state.stderr} disabled={true} />
              </div>
            )
          }
        </div>


      </div>

    );
  }

}

export default App;
