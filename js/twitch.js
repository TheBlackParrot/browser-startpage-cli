funcs.twitch = {
	shell: true,
	prompt: "twitch",

	auth: {
		metadata: {
			description: "Authorizes this page to read data from your Twitch.tv account."
		},

		main: function(data) {
			//var twitch_access_token = localStorage.getItem("twitch_access_token");
			var url_parts = ["https://api.twitch.tv/kraken/oauth2/authorize"];
			var url = "";

			url_parts.push("?response_type=token");
			url_parts.push("&client_id=otsnmo6rxgu6qv4dlfz43vtx4hejk63");
			url_parts.push("&redirect_uri=http://192.168.1.150/startpage");
			url_parts.push("&scope=user_read");

			window.location = url_parts.join("");
			return "Requesting authentication with Twitch.tv...";
		}
	},

	live: {
		metadata: {
			args: [
				{
					name: "channel",
					type: "str",
					optional: true
				}
			],

			description: "Lists the status of live channels you follow."
		},

		main: function(data) {
			if(data) {
				return funcs.twitch.stream(data);
			}

			var token = localStorage.getItem("twitch_access_token");
			if(!token) {
				throw new Error("You need to authorize this page to read data from your Twitch.tv account. Please use the auth subcommand. If this is a fresh clone of the page from the repository, please register your own app and edit this script.");
			}

			lockPrompt(true);

			$.ajax({
				method: "GET",
				url: "https://api.twitch.tv/kraken/streams/followed?oauth_token=" + token,
				dataType: "json"
			}).done(function() {
				lockPrompt(false);
			}).success(function(response) {
				var live_users = [];
				var streams = response.streams;
				if(streams.length) {
					for(var idx in streams) {
						var data = streams[idx];
						var out = [];

						console.log(data);

						out.push('<span style="font-weight: 700; color: #b294bb">' + data.channel.name + '</span> streaming <em>' + data.channel.game + '</em>');
						out.push('<span style="opacity: 0.8">' + data.channel.status + ' :: <span style="color: #c66">' + data.viewers.toLocaleString() + ' viewers</span></span>');
						echo(out.join("\r\n") + "\r\n\r\n", true);
					}
				} else {
					throw new Error("No channels are currently live.");
				}
			});
		}
	},

	stream: {
		metadata: {
			args: [
				{
					name: "channel",
					type: "str",
				}
			],

			description: "Opens a Twitch.tv channel in the current page/tab."
		},

		main: function(data) {
			if(!data) {
				throw new Error("No Twitch.tv channel specified");
			}

			var url;
			window.location = url = "https://twitch.tv/" + data;

			return {
				parts: ['Navigating to <a href="' + url + '">' + url + '</a>...'],
				raw: true
			};
		}
	},

	help: {
		metadata: {
			description: "This command."
		},

		main: function() {
			return echoHelp(funcs.twitch);
		}
	}
}

if(window.location.hash.indexOf("#access_token=") != -1) {
	localStorage.setItem("twitch_access_token", window.location.hash.replace("#access_token=", ""));
}