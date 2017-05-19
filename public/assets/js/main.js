function loadWebSocket(app) {
  var socket = io(window.location.href);
  socket.on('next', function() {
    loadCurrentExcercise(app);
    loadAgenda(app);
  });
}

function loadCurrentExcercise(app) {
  $.get("/current", function(res) {
    app.exerciseNumber = res.number;
    app.exerciseText = res.text;
    var itv = setInterval(function() {
      if (window.srcEditor && window.srcEditor.setValue) {
        clearInterval(itv);
        window.srcEditor.setValue(res.baseCode);
      }
    }, 100);
  });
}

function loadGeneralInfo(app) {
  $.get("/general", function(res) {
    app.general = res;
  });
}

function loadEditor() {
  require.config({ paths: { vs: "/assets/js/monaco-editor/min/vs" } });
  require(["vs/editor/editor.main"], function() {
    var editor = monaco.editor.create(document.getElementById("editorPanel"), {
      value: '\n\nconsole.log("Hello world!");\n\n',
      language: 'javascript',
      theme: 'vs-dark'
    });
    window.srcEditor = editor;
  });
}

function loadAgenda(app) {
  $.get("/agenda", function(res) {
    app.agenda = res;
  });
}

function prepareApp() {
  var app = new Vue({
    el: "#app",
    data: {
      general: {},
      exerciseNumber: 1,
      exerciseText: "...",
      agenda: [],
      isAgendaOpen: false
    },
    methods: {
      toggleAgenda: function(){
        this.isAgendaOpen = !this.isAgendaOpen;
      }
    }
  });
  loadGeneralInfo(app);
  loadCurrentExcercise(app);
  loadAgenda(app);
  return app;
}

window.addEventListener("load", function() {
  loadEditor();
  var app = prepareApp();
  loadWebSocket(app);
  var out = "";
  myLog = function log() {
    var args = Array.prototype.slice.call(arguments);
    try {
      if (args[0].indexOf("%") >= 0) {
        out += "> " + sprintf.apply(sprintf, args) + "\n";
      } else {
        out += "> " + args.join(" ") + "\n";
      }
    } catch (error) {
      out += "> " + args.join(" ") + "\n";
    }
    document.getElementById("target").value = out;
  };
  var __console = {
    debug: myLog,
    error: myLog,
    info: myLog,
    log: myLog,
    warn: myLog,
    clear: function() {
      out = "";
    }
  };
  var __window = Object.assign({}, window);
  (__window.console = console), document.getElementById("btnClean").addEventListener("click", function(evt) {
    out = "";
    document.getElementById("target").value = out;
  });
  document.getElementById("btnRun").addEventListener("click", function(evt) {
    var code =
      ";(function(window, console){\n" +
      srcEditor.getValue() +
      "\n})(__window, __console);";
    try {
      var res = eval(code);
    } catch (error) {
      out += "" + error + "\n";
      document.getElementById("target").value = out;
    }
  });
});
