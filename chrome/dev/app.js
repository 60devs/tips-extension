var Utils = {
    t: (key) => {
        return key;
    },

    getParentByCls: (node, cls) => {
        while(! node.classList.contains(cls)) {
            node = node.parentNode;

            if(! node)
                return null;
        }

        return node;
    }
}

class BaseAgent {
    constructor() {
        this.users = [];
        this.user = null;
    }

    start() {
    }

    onDomChange() {
        this.initUser();
        this.initUnknownUsers();
        this.render();
    }

    discoverUsers(users) {
        setTimeout(() => {
            var items = {};

            for(var user of users)
                items[user] = true;

            this.onDiscoverUsersSuccess(items);
        }, 400);

        return ;
        var xhr = new XMLHttpRequest;

        xhr.open("/check/github", "POST", true);
        xhr.setRequestHeader("Content-type", "application/json");
        xhr.send(JSON.stringify(users));
        xhr.onstatechange = () => {
            if(xhr.readyState == 4 && xhr.status == 200)
                this.onDiscoverUsersSuccess(xhr.responseText);
        }
    }

    onDiscoverUsersSuccess(items) {
        for(let user in items) {
            if(items[user])
                this.users.push(user);
        }

        this.render();
    }
}

class GitterAgent extends BaseAgent {
    constructor() {
        super();
        this.type = "gitter";
    }

    start() {
        if(window.top == window)
            return ;

        new MutationObserver(this.onDomChange.bind(this)).observe(document, {
            childList: true,
            subtree: true
        });
    }

    initUser() {
        if(this.user)
            return ;

        try {
            this.user = window.top.document.querySelector(".menu-header__profile .menu-header__name").textContent.trim();
        } catch(e) {}
    }

    initUnknownUsers() {
        var nodes,
            users = [];

        nodes = document.querySelectorAll(".chat-item.burstStart[data-item-id]:not(.t-user) .js-chat-item-from");
        nodes = [].slice.call(nodes);

        for(let node of nodes) {
            users.push(node.textContent.trim());
            Utils.getParentByCls(node, "chat-item").classList.add("t-user");
        }

        var unknownUsers = [];

        for(let user of users) {
            if(this.users.indexOf(user) == -1)
                unknownUsers.push(user);
        }

        if(unknownUsers.length > 0)
            this.discoverUsers(unknownUsers);
    }

    renderButton(user) {
        var template = document.createElement("template");

        template.innerHTML = `
            <a href="http://tips-for-help.com/pay/github/${user}" target="_blank" class="t-button">
                ${Utils.t("leave tips")}
            </a>`

        return template.content;
    }

    render() {
        var nodes;

        nodes = document.querySelectorAll(".t-user[data-item-id] .js-chat-item-from");
        nodes = [].slice.call(nodes);

        for(let node of nodes) {
            var chatItemNode = Utils.getParentByCls(node, "t-user"),
                user = node.textContent.trim();

            if(this.user == user || chatItemNode.querySelector(".t-button"))
                continue;

            if(this.users.indexOf(user) > -1) {
                var button = this.renderButton(user),
                    placeholder = chatItemNode.querySelector(".js-chat-item-details");

                placeholder.appendChild(button);
            }
        }
    }
}

class StackOverflowAgent extends BaseAgent {
    constructor() {
        super();
        this.type = "stackoverflow";
    }

    start() {
        new MutationObserver(this.onDomChange.bind(this)).observe(document, {
            childList: true,
            subtree: true
        });
    }

    initUser() {
        if(this.user)
            return ;

        try {
            var href = document.querySelector(".profile-me").getAttribute("href"),
                user = href.match(/\d+/)[0];

            this.user = user;
        } catch(e) {}
    }

    initUnknownUsers() {
        var nodes,
            users = [];

        nodes = document.querySelectorAll(".answer:not(.t-user) .user-info:last-child .user-details a");
        nodes = [].slice.call(nodes);

        for(let node of nodes) {
            users.push(node.getAttribute("href").match(/\d+/)[0]);
            Utils.getParentByCls(node, "answer").classList.add("t-user");
        }

        var unknownUsers = [];

        for(let user of users) {
            if(this.users.indexOf(user) == -1)
                unknownUsers.push(user);
        }

        if(unknownUsers.length > 0)
            this.discoverUsers(unknownUsers);
    }

    renderButton(user) {
        var template = document.createElement("template");

        template.innerHTML = `
            <a href="http://tips-for-help.com/pay/stackoverflow/${user}" target="_blank" class="t-button t-stackoverflow-button">
                ${Utils.t("leave tips")}
            </a>`

        return template.content;
    }

    render() {
        var nodes;

        nodes = document.querySelectorAll(".t-user .user-info:last-child .user-details a");
        nodes = [].slice.call(nodes);

        for(let node of nodes) {
            var answerNode = Utils.getParentByCls(node, "t-user"),
                user = node.getAttribute("href").match(/\d+/)[0];

            if(this.user == user || answerNode.querySelector(".t-button"))
                continue;

            if(this.users.indexOf(user) > -1) {
                var button = this.renderButton(user),
                    placeholder = answerNode.querySelector(".vt > .post-menu");

                placeholder.appendChild(button);
            }
        }
    }
}

class Application {
    constructor() {
        this.initAgent();
        this.agent.start();
    }

    initAgent() {
        var host = location.hostname,
            agent;

        if(/^stackoverflow\.com$/.test(host))
            agent = StackOverflowAgent;

        if(/^gitter\.im$/.test(host))
            agent = GitterAgent;

        this.agent = new agent;
    }
}

new Application;