import './App.css';

import React from 'react'
import axios from 'axios'
import 'reset-css';
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-golang";
import "ace-builds/src-noconflict/mode-rust";
import "ace-builds/src-noconflict/mode-ruby";
import "ace-builds/src-noconflict/mode-perl";
import "ace-builds/src-noconflict/mode-php";
import "ace-builds/src-noconflict/mode-sh";
import "ace-builds/src-noconflict/theme-ambiance";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-xcode";
import "ace-builds/src-noconflict/theme-chrome";
import "ace-builds/src-noconflict/theme-clouds";

import ReactLoading from "react-loading";

class App extends React.Component {

  state = {
    theme: 'ambiance', // 编辑器主题
    code: '', // 初始代码
    lang: 'c_cpp|c', // 默认语言
    stdin: '', // 标准输入内容
    stdout: '', // 标准输出
    stderr: '', // 标准错误输出
    tabIndex: 0, // 指定显示的选项卡
    running: false, // 记录是否在运行代码
  }

  // 主题列表
  themes = ["ambiance", "chaos", "github", "xcode", "chrome", "clouds"]

  // 语言列表, name是传给后端的，value是传给ace的
  langs = [
    { name: "c", value: "c_cpp" }, { name: "cpp", value: "c_cpp" },
    { name: "rust", value: "rust" }, { name: "golang", value: "golang" },
    { name: "python2", value: "python" }, { name: "python3", value: "python" },
    { name: "ruby", value: "ruby" },
    { name: "php5", value: "php" }, { name: "php7", value: "php" }, { name: "php8", value: "php" }
  ]

  componentDidMount() {
    this.setState({
      code: `#include <stdio.h>

int main(){
  printf("hello world");
  return 0;
}`})
  }

  languageChange = (e) => {
    console.log(e.target.value)
    this.setState({ lang: e.target.value });
  }
  themeChange = (e) => {
    console.log(e.target.value)
    this.setState({ theme: e.target.value });
  }

  codeChange = (value) => {
    console.log(value)
    this.setState({ code: value })
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
      url: '/api/run',
      data: {
        lang: this.state.lang.split("|")[1],
        code: this.state.code
      }
    }).then(function (response) {

      const res = response.data;

      that.setState({
        stdout: res.data.stdout,
        stderr: res.data.stderr,
      })

      console.log(response)

      that.setState({ running: false });

    }).catch((e) => {
      console.log("请求出错:", e)
      that.setState({ running: true });
    });
  }

  render() {

    return (
      <div className="app">
        <div class="loading" style={{ display: this.state.running ? "block" : "none" }}>
          <ReactLoading class="ani" type="spinningBubbles" color="#fff" />
        </div>
        <div className='tool-bar'>
          <div class="links">
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
            <label>编程语言</label>
            <select value={this.state.lang} onChange={this.languageChange}>
              {
                this.langs.map((item, index) => {
                  const { name, value } = item;
                  return (<option key={index} value={value + "|" + name}>{name}</option>)
                })
              }
            </select>
          </div>
        </div>

        <AceEditor
          value={this.state.code}
          mode={this.state.lang.split("|")[0]}
          theme={this.state.theme}
          onChange={this.codeChange}
          fontSize={20}
          name="noxue-code"
          height='500px'
          width='100%'
          editorProps={{ $blockScrolling: true }}
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
