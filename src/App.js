import './App.css';

import React from 'react'
import axios from 'axios'
import 'reset-css';
import CodeMirror from '@uiw/react-codemirror';
import { StreamLanguage } from '@codemirror/stream-parser';
import { go } from '@codemirror/legacy-modes/mode/go';
import { ruby } from '@codemirror/legacy-modes/mode/ruby';
import { cpp } from "@codemirror/lang-cpp";
import { python } from "@codemirror/lang-python";
import { php } from "@codemirror/lang-php";
import { rust } from '@codemirror/lang-rust';


import ReactLoading from "react-loading";

class App extends React.Component {

  state = {
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
  langs = ["c", "cpp", "rust", "golang", "python2", "python3", "php5", "php7", "php8", "ruby"]

  langModes = {
    "c": cpp(),
    "cpp": cpp(),
    "rust": rust(),
    "golang": StreamLanguage.define(go),
    "php5": php(),
    "php7": php(),
    "php8": php(),
    "python2": python(),
    "python3": python(),
    "ruby": StreamLanguage.define(ruby),
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

    // 禁止手机浏览器下拉
    document.addEventListener('touchmove', function (ev) {
      ev.preventDefault();
    }, { passive: false });


    let defaultCode = `#include <stdio.h>

// 欢迎使用不学网(noxue.com)提供的在线编译器
// 快捷键 Ctrl+S 自动编译
// 代码会自动保存，打开浏览器依然存在
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
        that.setState({ stdout: res.msg, stderr:'' });
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

  render() {

    return (
      <div className="app">
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
          value={this.state.code}
          height="500px"
          width='100%'
          theme={this.state.theme}
          extensions={[this.langModes[this.state.lang]]}
          onChange={this.codeChange}
        />

        <div className='result'>

          <div className='tabs'>
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
