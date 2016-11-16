var funcs = {
	eval: {
		metadata: {
			args: [
				{
					name: "code",
					type: "varied"
				}
			],

			description: "Evaluates code and prints the result."
		},

		main: function(code) {
			var ret;
			if(ret) {
				echo(ret);
			}
			return window.eval(code);
		}
	},

	date: {
		metadata: {
			description: "Prints the current date and time."
		},

		main: function() {
			return new Date().toString();
		}
	}
}

var global_funcs = {
	help: {
		metadata: {
			description: "This command"
		},

		main: function() {
			return echoHelp(contexts[active_context]);
		}
	},

	clear: {
		metadata: {
			description: "Clears all output."
		},

		main: function() {
			$(".output").empty();
			$("#main_input").val("");
		}
	}	
}

function echoHelp(func_context) {
	if(!func_context) {
		func_context = $.extend({}, contexts[active_context], global_funcs);
	} else {
		func_context = $.extend({}, func_context, global_funcs);
	}

	var ret = [];

	for(var func_name in func_context) {
		var func = func_context[func_name];
		
		if(typeof func !== "object") {
			continue;
		}

		var parts = [];

		if(func.shell) {
			var header = '<span class="help_func_shell_name">' + func_name + '</span>';
			parts.unshift('<span class="help_func_args"><em>(interactive shell)</em></span>');
		} else {
			var header = '<span class="help_func_name">' + func_name + '</span>';
		}
		
		if(func.metadata) {
			var meta = func.metadata;

			if(meta.args) {
				var arg_list = [];

				for(var i in meta.args) {
					var arg = meta.args[i];

					arg_list.push(arg.type + '<span class="help_func_args_name"> ' + arg.name + '</span>');
				}

				header = header + ' <span class="help_func_args">(' + arg_list.join(", ") + ')</span>';
			}

			if(meta.description) {
				parts.push(meta.description);
			}
		}

		parts.unshift(header);

		ret.push(parts.join("\r\n") + "\r\n\r\n");
	}

	return {
		raw: true,
		parts: ret
	};
}

function echo(data, raw) {
	if(typeof data !== "object") {
		data = {
			raw: raw,
			parts: [data]
		}
	}

	console.log(data);

	for(var i in data.parts) {
		var part = data.parts[i];

		str = new String(part);
		if(!data.raw) {
			console.log("preventing xss...");
			str = str.replace(/\</g, "&lt;");
		}
		$(".output").append(createRow([str]));
	}
}

var contexts = [funcs];
var active_context = 0;

function parseInput(data, func_context) {
	var parts = data.split(" ");
	var func = parts[0];

	var possible_completions = [];

	console.log(func_context);
	if(!func_context) {
		func_context = $.extend({}, contexts[active_context], global_funcs);
	} else {
		func_context = $.extend({}, func_context, global_funcs);
	}

	var _fn = Object.keys(func_context);
	var func_names = [];
	for(var i in _fn) {
		var _ctx = func_context[_fn[i]];
		console.log(_ctx);
		if(typeof _ctx === "object" || typeof _ctx === "function") {
			console.log("SHOULD ADD " + _fn[i]);
			func_names.push(_fn[i]);
		}
	}
	func_names.push('exit');
	console.log(func_names);

	for(var i in func_names) {
		var to_check = func_names[i];

		if(to_check.indexOf(func) == 0) {
			possible_completions.push(to_check);
		}
	}
	console.log(possible_completions);

	if(possible_completions.length > 1) {
		console.log("returning possibles");
		return possible_completions;
	} else if(possible_completions.length == 1) {
		func = possible_completions[0];
	}

	console.log(func_context[func]);

	if(func == "exit") {
		var old_prompt = contexts[active_context].prompt;
		exitShell();
		return "Leaving " + old_prompt + "...";
	}

	// purposely going back to Object.keys, exit is pre-defined
	if(Object.keys(func_context).indexOf(func) != -1) {
		if(func_context[func].shell) {
			enterShell(func, func_context[func]);
		} else {
			return func_context[func].main(parts.slice(1).join(" "));
		}
	} else {
		try {
			return window.eval(data);
		} catch(err) {
			throw err;
		}
	}
}

function enterShell(prompt, context) {
	contexts.push(context);
	active_context++;
	changePrompt(context.prompt);
}

function exitShell() {
	if(contexts.length > 1) {
		contexts.pop(contexts[active_context]);
	}

	active_context--;
	if(active_context < 0) {
		active_context = 0;
	}

	var prompt = "";
	if("prompt" in contexts[active_context]) {
		prompt = contexts[active_context].prompt;
	}

	changePrompt(prompt);
}

function changePrompt(data) {
	$("#main_prompt").html(data + ">&nbsp;");
	$("#main_input").val("");
}

function createRow(parts) {
	var row = $('<div class="output_row"></div>');
	for(var i in parts) {
		var part = parts[i];
		row.append(part);
	}

	return row;
}

function outputCurrentPrompt() {
	var prompt = $("#main_prompt").clone().attr("id", "");
	var input = $("#main_input").val().replace(/\</g, "&lt;");

	$(".output").append(createRow([prompt, input]));
}

function getInputHistory() {
	var history = localStorage.getItem("history");

	if(!history) {
		return [];
	} else {
		return JSON.parse(history);
	}
}

function addToHistory(input) {
	if(!input) {
		return;
	}

	var history = getInputHistory();

	history.push(input);
	if(history.length > 100) {
		history.splice(1);
	}

	localStorage.setItem("history", JSON.stringify(history));
}

$("#main_input").keydown(function(event) {
	switch(event.which) {
		case 38: // up arrow
			var history = getInputHistory();
			var idx = parseInt($(this).attr("history_idx") ? $(this).attr("history_idx") : history.length) - 1;

			if(idx >= history.length) {
				idx = history.length - 1;
			} else if(idx < 0) {
				idx = 0;
			}

			$(this).val(history[idx]);
			setTimeout(function() {
				$("#main_input")[0].selectionStart = $("#main_input")[0].selectionEnd = 10000;
			}, 0);

			$(this).attr("history_idx", idx);

			break;
		
		case 40: // down arrow
			var history = getInputHistory();
			var idx = parseInt($(this).attr("history_idx") ? $(this).attr("history_idx") : history.length) + 1;

			if(idx >= history.length) {
				$(this).val("");
				break;
			} else if(idx < 0) {
				idx = 0;
			}

			$(this).val(history[idx]);
			setTimeout(function() {
				$("#main_input")[0].selectionStart = $("#main_input")[0].selectionEnd = 10000;
			}, 0);

			$(this).attr("history_idx", idx);
			break;

		case 37:
		case 39:
			// catching to prevent history issues (left/right arrow, respectively)
			break;

		case 13: // enter/return
			outputCurrentPrompt();

			try {
				var out = parseInput($(this).val());
				console.log(out);

				if(out) {
					if(Array.isArray(out)) {
						var hide_keys = ['main', 'metadata'];
						for(var i in hide_keys) {
							var idx = out.indexOf(hide_keys[i]);

							if(idx != -1) {
								out.splice(idx, 1);
							}
						}

						echo(out.join("\t"));
					} else {
						echo(out);

						$(this).attr("history_idx", "");
						addToHistory($(this).val());

						$(this).val("");
					}
				}
			} catch(e) {
				echo('<span class="error">' + e + '</span>', true);
			}

			$(".wrapper")[0].scrollTop = $(".wrapper")[0].scrollHeight;

			break;

		default:
			// clear history
			break;
	}
});

function focusInput() {
	var pos = $(".wrapper")[0].scrollTop;
	$("#main_input").focus();

	$(".wrapper")[0].scrollTop = pos;
}
focusInput();

$(document).on('click', 'body', function(event) {
	event.preventDefault();

	focusInput();
});

/* helpers */
function getFunctionsFromObject(object) {
	var sub_funcs = Object.keys(object);
	var to_remove = ['main', 'settings', 'metadata'];
	
	for(var i in to_remove) {
		var idx = sub_funcs.indexOf(to_remove[i]);

		if(idx != -1) {
			sub_funcs.splice(sub_funcs.indexOf(to_remove[i]), 1);
		}
	}

	return sub_funcs;
}

function lockPrompt(state) {
	$("#main_input").prop("disabled", state);
	if(!state) {
		focusInput();
	}
}