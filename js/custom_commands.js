var lol = 0;

funcs.test = {
	metadata: {
		description: "Example custom command, see js/custom_commands.js"
	},

	main: function() {
		lol++;
		echo("Called " + lol + " times.");
	}
}