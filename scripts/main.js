(function(){
    var Section = function(name) {
    this.Title = name;
    this.Headline = "";
    this.Icon = "forumbee";
    this.Columns = "1";
    this.Content = [{
        Type: "Paragraph",
        Value: "Sample text..."
    }];
}


var app = angular.module('app', ['colorpicker.module', 'ngSanitize']).config(function($sceDelegateProvider) {
    $sceDelegateProvider.resourceUrlWhitelist([
        'self',
        "https://www.youtube.com/embed/**"
    ]);
});

app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'event': event});
                });

                event.preventDefault();
            }
        });
    };
});

app.controller('ModHomepageCtrl', function($scope) {


	//------------ SAVING AND LOADING -------------//
    $scope.GitHubCreds = {
        username: "CoreyClarkPhD",
        password: "",
        account: 'CoreyClarkPhD',
        repo: 'Omega',
        file: "Manifest.json",
        branch: 'gh-pages'
    }

    $scope.services = {
        getRepo: function() {
        	//debug flag
        	if((window.location + "").indexOf('file:////'))
        		return "TUG-Nacho"
            var r = (window.location + "").substring((window.location + "").indexOf("github.io/") + 10).replace(/\/[a-z]+\.html/, "@@")
            return r.substring(0, r.indexOf("@@"));
        },
        download: function(){
            var blob = new Blob([JSON.stringify($scope.modManifest)]);
            saveAs(blob, $scope.GitHubCreds.file);
        },
        getManifest: function() {
            $.ajax({
                type: "GET",
                dataType: "text",
                url: $scope.GitHubCreds.file,
                success: function(msg) {
                    $scope.modManifest = $scope.system.validateManifest(JSON.parse(msg))
                    $scope.system.manifestLoaded()
                    //fixes colors in sub tabs after init
                    setTimeout(function() {
                        $scope.system.setTheme()
                    }, 200)

                // type: "GET",
                // url: "https://raw.githubusercontent.com/Devotus/TUG-Nacho/master/Manifest.json",
                // success: function(msg) {
                //     $scope.modManifest = $scope.system.validateManifest(JSON.parse(msg));
                //     $scope.system.manifestLoaded()
                //     //fixes colors in sub tabs after init
                //     setTimeout(function() {
                //         $scope.system.setTheme()
                //     }, 200)
                },
                error: function(e) {
                    console.log("could not get manifest - " + e)
                    console.log(e)
                    noty({
                        text: "Could't load mod manifest.",
                        type: 'error',
                        dismissQueue: true,
                        layout: "topRight",
                        theme: 'relax',
                        timeout: 3000
                    });
                }
            });
        },
        getFileInfo: function(justInfo, cb) {
            $.ajax({
                type: "GET",
                contentType: "application/json",
                dataType: "json",
                url: "https://api.github.com/repos/" + $scope.GitHubCreds.account + "/" + $scope.GitHubCreds.repo + "/contents/" + $scope.GitHubCreds.file + "?ref=" + $scope.GitHubCreds.branch,
                headers: {
                    "Authorization": "Basic " + btoa($scope.GitHubCreds.username + ":" + $scope.GitHubCreds.password)
                },
                success: function(msg) {
                    $scope.fileInfo = msg
                    cb()
                    //fixes colors in sub tabs after init
                    setTimeout(function() {
                        $scope.system.setTheme()
                    }, 200)
                },
                error: function(e) {
                    console.log("could not get file info - " + e)
                    console.log(e)
                    noty({
                        text: "Could't retrieve Git repo information. Please try again later.",
                        type: 'error',
                        dismissQueue: true,
                        layout: "topRight",
                        theme: 'relax',
                        timeout: 3000
                    });
                }
            })
        },
        save: function() {
            this.getFileInfo(true, function() {
                $.ajax({
                    type: "PUT",
                    contentType: "application/json",
                    dataType: "json",
                    url: "https://api.github.com/repos/" + $scope.GitHubCreds.account + "/" + $scope.GitHubCreds.repo + "/contents/" + $scope.GitHubCreds.file,
                    data: JSON.stringify({
                        "message": "Commit from the Nerd Kingdom Page Builder",
                        "content": btoa(JSON.stringify($scope.modManifest)) + "",
                        "sha": $scope.fileInfo.sha + "",
                        "branch": $scope.GitHubCreds.branch
                    }),
                    headers: {
                        "Authorization": "Basic " + btoa($scope.GitHubCreds.username + ":" + $scope.GitHubCreds.password)
                    },
                    success: function(msg) {
                        console.log(msg)
                        $scope.fileInfo.sha = msg.commit.sha
                       	$scope.alert("Mod Saved", "Your manifest has been updated. Changes may take a few minutes to take effect.")
                    },
                    error: function(e) {
                        console.log("could not get file info - " + e)
                        console.log(e)
                        noty({
                            text: "Could't save the page. Please try again.",
                            type: 'error',
                            dismissQueue: true,
                            layout: "topRight",
                            theme: 'relax',
                            timeout: 3000
                        });
                        $scope.services.getFileInfo(true, function() {
                            $scope.services.save();
                        })
                    }
                })
            })

        }
    }

    //------------ SYSTEM - INITALIZATION AND BUILDER REFRESH -------------//

    $scope.system = {
        getYouTubeLink: function(id) {
            return "https://www.youtube.com/embed/" + id
        },
        manifestLoaded: function() {
            //init - wrapped in timeout to fire function directly after controller creation.
            setTimeout(function() {
                //$scope.defaultSections.home.insertHeaderMedia()

                if ($scope.modManifest.WebPage) {
                    $scope.system.setLayout();
                    $scope.system.setTheme();
                }

                if ($scope.modManifest.Media.Images.length == 0) {
                    $('.detailBox').addClass('medium-12');
                }
                $scope.$apply()
                //Show the first tab - must be done after document foundation call.
                $('.first').show();
            }, 0)
        },
        validateManifest: function(m) {
            if (!m.Icon) {
                m.Icon = "http://tugfiles.nerdkingdom.com/www/img/tug-logo.png";
            }
            if (!m.Media) {
                m.Media = {
                    Videos: [],
                    Images: [{
                        src: 'http://o.aolcdn.com/hss/storage/midas/9e6810ebd8d48497f6d8a7c5e6c7f405/201444977/tug.jpg',
                        caption: ""
                    }, {
                        src: 'http://www.themarysue.com/wp-content/uploads/2013/05/media11-640x408.png#geekosystem',
                        caption: ""
                    }]
                }
            }
            if (!m.WebPage) {
                m.WebPage = {
                    Sections: [{
                        "Title": "Changes",
                        "Headline": "To change or add sections, edit the mod\'s manifest.",
                        "Icon": "forumbee",
                        "Columns": 1,
                        "Content": [{
                            "Type": "Paragraph",
                            "Value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dapibus arcu at dui congue iaculis. Morbi placerat lorem laoreet sem elementum, vel laoreet sem ultricies. Cras aliquam, libero molestie vehicula vulputate, dui est condimentum nisi, eget sodales erat sem sit amet lectus. Donec nec imperdiet felis, porttitor sollicitudin nulla. Donec ac vestibulum ligula. Nam cursus tristique massa, in tempus elit molestie a. Suspendisse metus dolor, cursus malesuada eros id, convallis bibendum magna. Nullam laoreet est ante, id ornare ante finibus non."
                        }, {
                            "Type": "Paragraph",
                            "Value": "Etiam eget tincidunt nulla. Proin auctor iaculis mauris, vitae sollicitudin velit. Morbi et odio lorem. Donec in nisi a erat pellentesque porttitor. Nam risus neque, sagittis eget urna a, efficitur vulputate nibh. Duis et sem eu leo condimentum dictum. Mauris a gravida dui. Donec pretium tortor ut pellentesque pharetra. Quisque posuere aliquet massa eu ornare. Vivamus tincidunt massa ac erat commodo tempus. Nunc a dui sed nisl cursus tincidunt ac ut mauris. Nulla elementum non lectus sit amet fermentum. Nunc ac velit et orci vestibulum pharetra. Nullam nec enim eleifend, dignissim quam vel, tincidunt tellus. Donec vel commodo augue."
                        }]
                    }],
                    Theme: {
                        "Name": "Nerd Kingdom",
                        "Layout": "Scroll",
                        "HideNavBar": false,
                        "Primary": {
                            "Color": "#175ba5",
                            "Text": "#ffffff",
                            //"Image": "http://www.atableprovencale.com/wp-content/uploads/2013/04/Fleur-De-Lis-Pattern-Background-2-s5.png"
                        },
                        "Secondary": {
                            "Color": "#d7e1e7",
                            "Text": "#333333"
                        },
                        "Body": {
                            "Color": "#ecf0f1",
                            "Text": "#333333",
                            "Image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAATElEQVQYV2N8+e7jfwYoEBfiZ4SxYTRMnhFZIUgSl2IMhbgUg61CNxWbYribCClGcTw+xTh9iex7kAcxFOJyM9jX+MIPZjI8eAgpBgAi7zbuVcN9gQAAAABJRU5ErkJggg=="
                        }
                    }
                }
            }
            return m
        },
        setLayout: function() {
            if ($scope.modManifest.WebPage.Theme.Layout == "Tabbed") {
                $('#modDetails, .userContent').addClass('tab-view')
                $('.userContent.tab-view, .userContent.tab-view *').css('color', $scope.modManifest.WebPage.Theme.Body.Text, "important");
                $('.tab-view').hide();
                //For tabbed layouts, change the page.
                this.changePage('detail');
            } else {
                $('.tab-view').show();
                $('#modDetails, .userContent').removeClass('tab-view')
                this.setTheme();
            }
            $('.tabContainer .tab-view').hide();
            $('.tabContainer .nav li:first-child').addClass('active');
            $('.tabContainer .first').show();
            $('#editOverlay').css('top', '0px');
        },
        setTheme: function() {
            if ($scope.modManifest.WebPage['Theme']) {
                $('body, .bodyClass').css('background-color', $scope.modManifest.WebPage.Theme.Body.Color);
                $('body, .bodyClass').css('color', $scope.modManifest.WebPage.Theme.Body.Text);

                //set classes
                $('.userContent:nth-of-type(3n+3), .primary ').addClass('primary')
                $('.userContent:nth-of-type(odd), .secondary, footer, .userContent:last-of-type').addClass('secondary')

                //class cleanup
                $('.primary.secondary').removeClass('secondary');
                $('.userContent:nth-of-type(even):not(.userContent:last-of-type)').removeClass('secondary')
                $('.userContent:nth-of-type(even):not(.userContent:last-of-type)').removeClass('primary')
                $('.userContent:nth-of-type(even):not(.userContent:last-of-type)').addClass('bodyClass')

                //apply colors
                $('.secondary, footer').css('background-color', $scope.modManifest.WebPage.Theme.Secondary.Color);
                $('.userContent:nth-of-type(odd) .carousel-caption, .secondary, .secondary *, footer,  footer *').css('color', $scope.modManifest.WebPage.Theme.Secondary.Text);
                $('.userContent:nth-of-type(even), .carousel-caption').css('color', $scope.modManifest.WebPage.Theme.Body.Text)
                $('.userContent:nth-of-type(even)').css('background-color', 'transparent');
                $('.primary ').css('background-color', $scope.modManifest.WebPage.Theme.Primary.Color);
                $('.primary, .primary *').css('color', $scope.modManifest.WebPage.Theme.Primary.Text);
                

                if ($scope.modManifest.WebPage.Theme.Primary.Image) {
                    $('.primary').css('background-image', 'url(' + $scope.modManifest.WebPage.Theme.Primary.Image + ')', 'repeat');
                }
                if ($scope.modManifest.WebPage.Theme.Primary.Image) {
                    $('.secondary, footer').css('background-image', 'url(' + $scope.modManifest.WebPage.Theme.Secondary.Image + ')', 'repeat');
                }
                if ($scope.modManifest.WebPage.Theme.Body.Image) {
                    $('body, .bodyClass').css('background', 'url(' + $scope.modManifest.WebPage.Theme.Body.Image + ')', 'repeat');
                } else {
                    $('body, .bodyclass').css('background', $scope.modManifest.WebPage.Theme.Body.Color);
                }
                if ($scope.modManifest.WebPage.Theme.Primary.Background) {
                    $('.primary').css('background', $scope.modManifest.WebPage.Theme.Primary.Background, 'repeat');
                } else {
                    $('.primary').css('background-image', "none");
                }
                
                $('.userContent:last-of-type').css('background-color', $scope.modManifest.WebPage.Theme.Secondary.Color);
                if ($scope.modManifest.WebPage.Theme.Secondary.Background) {
                    $('.secondary, footer').css('background', $scope.modManifest.WebPage.Theme.Secondary.Background);
                } else {
                    $('.secondary, footer').css('background-image', "none");
                }
                if ($scope.modManifest.WebPage.Theme.Body.Background) {
                    $('body, .bodyClass').css('background', $scope.modManifest.WebPage.Theme.Body.Background);
                } else {
                    $('body, .bodyClass').css('background-image', "none");
                }
                if ($scope.modManifest.WebPage['DetailHidden'] == true) {
                    $('.userContent[data-index=0]').addClass('secondary')
                    $('.userContent[data-index=0]').removeClass('primary')
                    $('.userContent[data-index=0]').css('background-color', $scope.modManifest.WebPage.Theme.Secondary.Color);
                    $('.userContent[data-index=0], .userContent[data-index=0] *').css('color', $scope.modManifest.WebPage.Theme.Secondary.Text);
                }
            }
        },
        //Changes the page for tabbed layouts.
        changePage: function(page, elm, event) {
            var prefix = ''
            if (event && $scope.editOverlay.pane)
                return;
            if (elm) {
            	var sectionId = "";
            	var parentIndex = "";
            	if(event && event.target){
            		sectionId = '#' + $(event.target).parents('section.userContent').attr('id')
            		parentIndex = $(event.target).parents('.tabContainer').attr('data-index')
            	}else{
            		sectionId = '#' + $(elm).parents('section.userContent').attr('id')
            		parentIndex = $(elm).parents('.tabContainer').attr('data-index')
            	}
                prefix = sectionId + '.userContent '
                if (elm[0] != '#' && elm.indexOf('section[data-index') < 0)
                    elm = '#' + elm;
               
                $(prefix + ' .tabContainer[data-index=' + parentIndex + '] .tab').removeClass('active');
                $(prefix + ' .tabContainer[data-index=' + parentIndex + '] div:not(' + elm + ').tab-view').hide();
                $(prefix + ' .tabContainer[data-index=' + parentIndex + '] .detailNav li:nth-child(' + page + ')').addClass('active')
                if (elm)
                    $(prefix + '.tabContainer[data-index=' + parentIndex + '] ' + elm.lastWord() + ', ' + prefix + ' .tabContainer[data-index=' + parentIndex + '] ' + elm.lastWord() + ' .tab-view').show();
                else
                    $(prefix + ' .tabContainer[data-index=' + parentIndex + '] .tab-view:nth-child(' + (page + 2) + ')').show();
            } else {
                if ($scope.modManifest.WebPage.Theme.Layout != "Tabbed")
                    return;
                $('.pageTabs .tab').removeClass('active');
                $('.page-tab-view').hide();
                if (page == "detail") {
                    $('#details').addClass('active');
                    $('#modDetails').show();
                } else {
                    $('.pageTabs .tab:nth-of-type(' + page + ')').addClass('active')
                    $($('.page-tab-view')[page - 1]).show()
                }
            }

            if (!elm) {
                $('.tabContainer:not(.subContainer) .nav li:first-child').addClass('active');
                $('.tabContainer .first').show();
            }
        },
        //change function for the theme select box
        changeTheme: function() {
            $scope.editOverlay.close();
            $scope.modManifest.WebPage.Theme = clean($scope.modManifest.WebPage.Theme);
            $scope.system.setLayout();
            $scope.system.setTheme();
            $scope.system.changePage('detail')
        },
        //Smooth scrolling
        jump: function(aid) {
            var aTag = $(aid);
            $('html,body').animate({
                scrollTop: aTag.offset().top
            }, 'slow');
        }
    }

    //------------ DEFAULT SECTION FUNCTIONALLITY -------------//

    $scope.defaultSections = {
        home: {
            insertHeaderMedia: function() {
                //Insert the first video if we have one.
                if ($scope.modManifest.Media.Videos.length > 0 && $scope.modManifest.Media.Videos[0] != "") {
                    $('#home .flex-video').html('<iframe width="560" height="315" src="https://www.youtube.com/embed/' + $scope.modManifest.Media.Videos[0] + '" frameborder="0" allowfullscreen=""></iframe>');
                    $('#home .flex-video').addClass('shadow');
                } else if ($scope.modManifest.Media.Images.length > 0) {
                    $('#home .flex-video').html('<img src="' + $scope.modManifest.Media.Images.shift().src + '"></img>');
                    $('#home .flex-video img').addClass('shadow');
                }
            },
            processYoutubeLink: function() {
                $scope.modManifest.Media.Videos[0] = $scope.modManifest.Media.Videos[0].replace("https://www.youtube.com/watch?v=", "").replace("https://www.youtube.com/embed/", "").replace("http://www.youtube.com/watch?v=", "").replace("http://www.youtube.com/embed/", "")
                this.insertHeaderMedia();
            }
        },
        modDetails: {
            getAuthors: function() {
                var arr = []
                for (var i = 0, len = $scope.modManifest.Authors.length; i < len; ++i) {
                    arr.push($scope.modManifest.Authors[i].DisplayName)
                }
                return arr.join(', ')
            },
            imageChange: function(arg) {
                console.log(arg)
            },
            categoryChange: function(arg) {
                console.log(arg)
                $scope.modManifest.Categories = []
            }
        }
    }

    //------------ UI - POPUPS AND GRAPHICAL RELATED FUNCTIONALITY -------------//

    $scope.icons = icons;

    $scope.areYouSurePopup = {
        message: "",
        cb: function() {},
        open: function(message, cb) {
            if (cb)
                this.cb = cb;
            if (message)
                this.message = message;
            $('#aysPopup').modal('show')
        },
        close: function() {
            $('#aysPopup').modal('hide')
        },
        yes: function() {
            this.cb();
        }
    }

    $scope.alertPopup = {
    	title: "Mod Saved",
        message: "Your manifest has been updated. Changes may take a few minutes to take effect.",
        cb: function() {},
        open: function(title, message, cb) {
            if (cb)
                this.cb = cb;
            if (message)
                this.message = message;
            if (message)
                this.title = title;
            $('#alertPopup').modal('show')
        },
        close: function() {
            $('#alertPopup').modal('hide')
            this.cb();
        }
    }
    $scope.alert = function(title, msg, cb){$scope.alertPopup.open(title, msg, cb);}


    $scope.captionPopup = {
        open: function(message, cb) {
            $('#captionPopup').modal('show')
        },
        close: function() {
            $('#captionPopup').modal('hide')
        }
    }

    $scope.savePopup = {
        open: function() {
            $('#savePopup').modal('show');
        },
        close: function() {
            $('#savePopup').modal('hide');
        }
    }

    $scope.imagePopup = {
        selectedColor: null,
        url: "",
        repeat: false,
        center: false,
        fixed: false,
        open: function(message, cb) {
            $scope.colorWindow.selectedColor['Image'] = ""
            if (!$scope.colorWindow.selectedColor.Background)
                $scope.colorWindow.selectedColor.Background = ""
            var bg = $scope.colorWindow.selectedColor.Background;
            this.repeat = bg.indexOf(" repeat") > -1;
            this.center = bg.indexOf("center") > -1;
            this.fixed = bg.indexOf("fixed") > -1;
            this.url = bg.substring(bg.indexOf('url(') + 4, bg.indexOf(')'));
            $('#imagePopup').modal('show')
        },
        close: function() {
            if (this.url)
                $scope.colorWindow.selectedColor.Background = "url(" + this.url + ") " + ((this.repeat) ? "repeat " : "no-repeat ") + ((this.center) ? "center " : "") + ((this.fixed) ? "fixed " : "")
            else
                $scope.colorWindow.selectedColor.Background = "";
            $('#imagePopup').modal('hide')
            $scope.system.setTheme();
        },
        cancel: function() {
            $('#imagePopup').modal('hide')
        }
    }

    $scope.colorWindow = {
        open: function() {
            if ($('#colorWindow').hasClass('active'))
                $('#colorWindow').removeClass('active')
            else {
                $('#colorWindow').addClass('active')
                $scope.editOverlay.stack = []
                $scope.editOverlay.close()
            }
        },
        close: function() {
            $('#colorWindow').removeClass('active')
        }
    }


    //------------ MAIN BUILDER OVERLAY -------------//

    $scope.editOverlay = {
        stack: [],
        pane: "",
        selectedContent: null,
        subtab: false,
        open: function(elm, index, evt) {
            try {
                evt.stopPropagation()
            } catch (e) {}

            //if it has an event use that to determine subtab status
            if(evt){
	            if($(evt.target).parents('.tab-view').length){
	            	this.subtab = true
	       		 	elm = 'section[data-index=' + $(evt.target).parents('section').attr('data-index') + '] .tab-view[data-index=' + $(evt.target).parents('.tab-view').attr('data-index') + ']'
	            }else{
	            	this.subtab = false;
	            }
    		}else{
    			this.subtab = false;
    		}

            if (this.pane == elm)
                return this.close();
            if (!elm) {
                if (this.stack.length == 0)
                    return this.close();
                elm = this.stack.pop();
            }

            $(elm).addClass('editing')
            if (this.stack.length > 0 && index)
                try {
                    $scope.system.changePage(index + 1, elm)
                } catch (e) {}
    
            if (!$(elm).hasClass('sub-tab'))
                this.stack = []
            else
            	this.subtab = true
            this.pane = elm;
            this.stack.push(elm)


            //Set section template if we open the overlay for anything but home and details
            if (elm != '#home' && elm != '#modDetails') {

                if ($(elm).hasClass('sub-tab')){
                	$scope.selectedSectionIndex = Number($(elm).parents(".userContent").attr('data-index')) || 0
                    $scope.selectedSection = $scope.modManifest.WebPage.Sections[$scope.selectedSectionIndex].Content[Number($(elm).parents(".tabContainer").attr('data-index')) || 0].Items[Number($(elm).attr('data-index')) || 0];
                }
                else{
                	$scope.selectedSectionIndex = Number($(elm).attr('data-index')) || 0
                    $scope.selectedSection = $scope.modManifest.WebPage.Sections[$scope.selectedSectionIndex];
                }
                $scope.editOverlay.template = 'sectionEdit'

                if ($scope.selectedSection.Content.length > 0)
                    this.selectedContent = $scope.selectedSection.Content[0];
            }

            if ($(elm).height() < 500 || this.stack.length > 0 && index) {
                //delay for animation
                setTimeout(_open, 500)
            } else {
                _open()
            }

            function _open() {
                $scope.editOverlay.resize();
                $('.edit').show()
                $('.userContent > .delete').hide()
                $('.edit i').removeClass('fa-times-circle');
                $('.edit i').addClass('fa-pencil');
                $('.edit i').css('color', 'inherit')
                $(elm + ' .columns .edit').hide()
                $(elm + ' .edit i').removeClass('fa-pencil');
                $(elm + ' .edit i').addClass('fa-times-circle');
                $(elm + ' .edit i').css('color', 'white')
                $(elm + ' > .delete').show()
                $(elm + ' > .delete i').css('color', 'white')
                $('#contentList li').removeClass('active')
                $('#editOverlay').show()
                $('#editOverlay').css('opacity', '1');

                if ($scope.selectedSection)
                    if ($scope.selectedSection.Content.length > 0) {
                        $('#contentList li:nth-child(2)').addClass('active')
                    }

                    //bind enter key for add fields
                setTimeout($scope.editOverlay.userList.bindAddField, 0);
                setTimeout($scope.editOverlay.tabList.bindAddField, 0);
                setTimeout($scope.editOverlay.imageList.bindAddField, 0);
                setTimeout($scope.editOverlay.bindAddClick, 0);
            }
            $scope.colorWindow.close()
        },
        close: function() {
            this.pane = "";
            this.selectedContent = null;
            this.stack.pop();
            if (this.stack.length > 0) {
            	$('.tab-view.editing').removeClass('editing')
                this.open()
            } else {
                $('#editOverlay').css('opacity', '0');
                $('#editOverlay').hide();
                $(this.pane + ' .edit i').removeClass('fa-times-circle');
                $(this.pane + ' .edit i').addClass('fa-pencil');
                $('.edit i').css('color', 'inherit');
                $('.userContent > .delete i, #modDetails > .delete i').css('color', 'inherit')
                $('.edit').show();
                $('.userContent > .delete, #modDetails > .delete').hide();
                $('.tab-view.editing').removeClass('editing')
                $('section.editing').removeClass('editing')
                $scope.system.setTheme();
            }
        },
        resize: function() {
            var elm = this.pane;
            var offset = $(elm + '.editing').offset();
            var wpad = 0;
            if ($(elm).hasClass('sub-tab'))
                wpad = 20;
            $('#editOverlay').width($(elm).width() + wpad)
            $('#editOverlay').height($(elm).height());
            try {
                $('#editOverlay').css('top', offset.top);
                $('#editOverlay').css('left', offset.left);
            } catch (e) {}
            $('.edit').show()
            $(elm + ' .columns .edit').hide()
        },
        processYoutubeLink: function() {
            $scope.editOverlay.selectedContent.Value = $scope.editOverlay.selectedContent.Value.replace("https://www.youtube.com/watch?v=", "").replace("https://www.youtube.com/embed/", "").replace("http://www.youtube.com/watch?v=", "").replace("http://www.youtube.com/embed/", "")
            $scope.$apply()
        },
        addSection: function(name, container) {
            if (!container)
                container = $scope.modManifest.WebPage.Sections;
            container.push(new Section(name));
            gname = name
            setTimeout(function() {
                $scope.editOverlay.resize();
                $scope.system.setTheme();
                if(container == $scope.modManifest.WebPage.Sections){
	                $scope.system.jump('#' + gname.firstWord().toLowerCase() + (container.length - 1));
	            }
            }, 100);
        },
        deleteSection: function(elmID) {
            $scope.areYouSurePopup.open("Are you sure you want to delete this piece of section?", function() {
                var index = Number($(elmID).attr('data-index'))
                $scope.editOverlay.close();
                $scope.modManifest.WebPage.Sections.splice(index, 1)
                $scope.editOverlay.selectedContent = null;
                $scope.areYouSurePopup.close();
            })
        },
        hideDetailSection: function() {
            $scope.areYouSurePopup.open("Are you sure you want to hide the built-in details section? You can unhide it in the top bar later.", function() {
                $scope.modManifest.WebPage.DetailHidden = true
                $scope.editOverlay.close();
                $scope.editOverlay.selectedContent = null;
                $scope.areYouSurePopup.close();
                $scope.system.setTheme();
                $('#unhideDetail').show()
            })
        },
        unhideDetailSection: function() {
            delete $scope.modManifest.WebPage.DetailHidden
            $('#unhideDetail').hide()
            setTimeout(function() {
                $scope.system.setTheme();
                $scope.system.jump('#modDetails')
                $(document).foundation()
            }, 0)
        },
        bindAddClick: function() {
            $('.fa-plus').unbind().click(function() {
                $('.fa-plus').siblings('input').focus()
                dropDown($('.fa-plus').siblings('select')[0])
            })
            $('#content > section').unbind().click(function() {
                $scope.editOverlay.close()
            })
        },
        //------------ editOverlay.contentList - CONTENT LIST FUNCTIONALLITY-------------//
        contentList: {
            newContentType: "",
            selectContent: function(arg, event) {
                $('#contentList li.active').removeClass('active')
                if ($scope.editOverlay.selectedContent != arg.content) {
                    $scope.editOverlay.selectedContent = arg.content
                    $(event.currentTarget).addClass('active');
                } else {
                    $scope.editOverlay.selectedContent = null;
                }
                setTimeout($scope.editOverlay.userList.bindAddField, 0)
                setTimeout($scope.editOverlay.tabList.bindAddField, 0)
                setTimeout($scope.editOverlay.imageList.bindAddField, 0)
            },
            addContent: function() {
                var obj = {
                    Type: $scope.editOverlay.contentList.newContentType
                };
                switch (this.newContentType) {
                    case "Paragraph":
                        obj.Value = "";
                        break;
                    case "Image":
                        obj.Height = 375;
                        //inline ifstatment to determin if the carousel is going inside a subtab
                        obj.Width = ($('#editOverlay').width() < 1000) ? Math.floor(930 / $scope.selectedSection.Columns) : Math.floor(970 / $scope.selectedSection.Columns);
                    case "List":
                    case "Tabs":
                        obj.Items = [];
                }
                $scope.selectedSection.Content.push(obj)
                this.newContentType = "";
                var rows = $('#contentList li:not("#addContent")');
                this.selectContent({
                    content: obj
                }, {
                    currentTarget: rows[rows.length - 1]
                })
                $scope.editOverlay.resize();
                setTimeout(function() {
                    $scope.editOverlay.resize()
                    $('#contentList li').removeClass('active')
                    $('#contentList li:nth-child(' + Number(rows.length + 1) + ')').addClass('active')
                }, 0)

            },
            deleteContent: function(index) {
                $scope.areYouSurePopup.open("Are you sure you want to delete this piece of content?", function() {
                    $scope.selectedSection.Content.splice(index, 1)
                    $scope.editOverlay.selectedContent = null;
                    $scope.areYouSurePopup.close();
                })
            }
        },
        //------------ editOverlay.userList - USER LIST FUNCTIONALLITY-------------//
        userList: {
            newUserListItem: "",
            selected: null,
            select: function(arg, event) {
                $('#userList li.active').removeClass('active')
                if (this.selected != arg.content) {
                    this.selected = arg.content
                    $(event.currentTarget).addClass('active');
                } else {
                    this.selected = null;
                }
            },
            add: function() {
                var item = $scope.editOverlay.userList.newUserListItem;
                $scope.editOverlay.selectedContent.Items.push(item)
                $scope.editOverlay.userList.newUserListItem = "";
                $scope.editOverlay.resize();
            },
            delete: function(index) {
                $scope.areYouSurePopup.open("Are you sure you want to delete this piece of content?", function() {
                    $scope.editOverlay.selectedContent.Items.splice(index, 1)
                    $scope.areYouSurePopup.close();
                })
                $scope.editOverlay.resize();
            },
            bindAddField: function() {
                $("#editOverlay .userList .add").bind('blur keyup', function(e) {
                    if (e.type === 'keyup' && e.which == 13) {
                        $(this).blur()
                        setTimeout(function() {
                            $("#editOverlay .userList .add").focus()
                        }, 0)
                        return;
                    }
                });
                setTimeout(function() {
                    $("#editOverlay .userList .add").focus()
                }, 0)
            }
        },
        //------------ editOverlay.imageList - IMAGE LIST FUNCTIONALLITY-------------//
        imageList: {
            newImageListItem: "",
            newImageListCaption: "",
            selected: null,
            select: function(arg, event) {},
            add: function() {
                $scope.editOverlay.selectedContent.Items.push({
                    src: $scope.editOverlay.imageList.newImageListItem,
                    caption: ""
                })
                $scope.editOverlay.imageList.newImageListItem = "";
                $scope.editOverlay.imageList.newImageListCaption = "";
                $('.carousel').carousel()
                $scope.editOverlay.resize();
            },
            delete: function(index) {
                $scope.areYouSurePopup.open("Are you sure you want to delete this piece of content?", function() {
                    $scope.editOverlay.selectedContent.Items.splice(index, 1)
                    $scope.areYouSurePopup.close();
                    $('.carousel').carousel(0);
                })
                $scope.editOverlay.resize();
            },
            addMedia: function() {
                $scope.modManifest.Media.Images.push({
                    src: $scope.editOverlay.imageList.newImageListItem,
                    caption: ""
                })
                $scope.editOverlay.imageList.newImageListItem = "";
                $scope.editOverlay.imageList.newImageListCaption = "";
                $scope.editOverlay.resize();
            },
            deleteMedia: function(index) {
                $scope.areYouSurePopup.open("Are you sure you want to delete this piece of content?", function() {
                    $scope.modManifest.Media.Images.splice(index, 1)
                    $scope.areYouSurePopup.close();
                })
                $scope.editOverlay.resize();
            },
            bindAddField: function() {
                $("#editOverlay .imageList .add").bind('blur keyup', function(e) {
                    if (e.type === 'keyup' && e.which == 13) {
                        $(this).blur()
                        setTimeout(function() {
                            $("#editOverlay .imageList .add").focus()
                        }, 0)
                        return;
                    }
                });
                setTimeout(function() {
                    $("#editOverlay .imageList .add").focus()
                }, 0)
            },
            edit: function(index, item) {
                $scope.editOverlay.imageList.selected = item
                $scope.captionPopup.open();
            }
        },
        //------------ editOverlay.tabList - TAB LIST FUNCTIONALLITY-------------//
        tabList: {
            newContentType: "",
            selected: null,
            select: function(arg, event) {
                $('#tabList li.active').removeClass('active')
                if (this.selected != arg.content) {
                    this.selected = arg.content
                    $(event.currentTarget).addClass('active');
                } else {
                    this.selected = null;
                }
            },
            edit: function(index, section, event) {
                $scope.editOverlay.open('section[data-index=' + $scope.selectedSectionIndex + '] ' + '.tab-view[data-index=' + index + ']', index)
            },
            add: function() {
                $scope.editOverlay.addSection($scope.editOverlay.tabList.newContentType, $scope.editOverlay.selectedContent.Items)
                this.newContentType = ""
                //$scope.editOverlay.resize();
            },
            delete: function(index) {
                $scope.areYouSurePopup.open("Are you sure you want to delete this section?", function() {
                    $scope.editOverlay.selectedContent.Items.splice(index, 1)
                    $scope.areYouSurePopup.close();
                    $scope.editOverlay.resize();
                })
            },
            bindAddField: function() {
                $("#editOverlay .tabList .add").bind('blur keyup', function(e) {
                    if (e.type === 'keyup' && e.which == 13) {
                        $(this).blur()
                        setTimeout(function() {
                            $("#editOverlay .tabList .add").focus()
                        }, 0)
                        return;
                    }
                });
                setTimeout(function() {
                    $("#editOverlay .tabList .add").focus()
                }, 0)
            }
        }
    }


	//------------ THEME LIBRARY - Fills the 'Change Theme...' select box -------------//    

    $scope.themeLibrary = [
        (function() {
            return {
                "Name": "Nerd Kingdom",
                "Layout": "Scroll",
                "HideNavBar": false,
                "Primary": {
                    "Color": "#175ba5",
                    "Text": "#ffffff",
                    "Background": ""
                },
                "Secondary": {
                    "Color": "#d7e1e7",
                    "Text": "#333333",
                    "Background": ""
                },
                "Body": {
                    "Color": "#ecf0f1",
                    "Text": "#333333",
                    "Background": "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAATElEQVQYV2N8+e7jfwYoEBfiZ4SxYTRMnhFZIUgSl2IMhbgUg61CNxWbYribCClGcTw+xTh9iex7kAcxFOJyM9jX+MIPZjI8eAgpBgAi7zbuVcN9gQAAAABJRU5ErkJggg==)"
                }
            }
        })(), {
            "Name": "TUG",
            "Layout": "Scroll",
            "HideNavBar": false,
            "Primary": {
                "Color": "#4E3C1C",
                "Text": "#fefde7",
                "Background": ""
            },
            "Secondary": {
                "Color": "#5b5a4d",
                "Text": "#fefde7",
                "Background": ""
            },
            "Body": {
                "Color": "#d7c789",
                "Text": "#333333",
                "Background": "url(http://tugfiles.nerdkingdom.com/www/img/bg.jpg) center no-repeat fixed"
            }
        }, {
            "Name": "Simple Red",
            "Layout": "Scroll",
            "HideNavBar": false,
            "Primary": {
                "Color": "#c0392b",
                "Text": "#fff",
                "Background": ""
            },
            "Secondary": {
                "Color": "#2c3e50",
                "Text": "#fff",
                "Background": ""
            },
            "Body": {
                "Color": "#ecf0f1",
                "Text": "#333333",
                "Background": ""
            }
        }, {
            "Name": "Simple Green",
            "Layout": "Scroll",
            "HideNavBar": false,
            "Primary": {
                "Color": "#27ae60",
                "Text": "#fff",
                "Background": ""
            },
            "Secondary": {
                "Color": "#2c3e50",
                "Text": "#fff",
                "Background": ""
            },
            "Body": {
                "Color": "#ecf0f1",
                "Text": "#333333",
                "Background": ""
            }
        }, {
            "Name": "Dark",
            "Layout": "Scroll",
            "HideNavBar": false,
            "Primary": {
                "Color": "#34495e",
                "Text": "#fff",
                "Background": ""
            },
            "Secondary": {
                "Color": "#333",
                "Text": "#fff",
                "Background": ""
            },
            "Body": {
                "Color": "#7f8c8d",
                "Text": "#fff",
                "Background": ""
            }
        }
    ]

    //------------ STUB modManifest INCASE ONE ISNT LOADED FROM GITHUB -------------//

    $scope.modManifest = {
        "Name": "Example",
        "Summary": "Example TUG mod for Devotus testing",
        "Description": "This is a simple example mod for TUG that is primarily used to test Devotus features.  It provides no functional gameplay benefit and should not be downloaded by anyone.",
        "Website": "",
        "Active": false,
        "TargetGame": {
            "Name": "TUG",
            "Version": {
                "Major": 0,
                "Minor": 0,
                "Revision": 0
            }
        },
        "Authors": [{
            "AccountName": "Maylyon",
            "DisplayName": "Maylyon",
            "Email": "maylyon@nerdkingdom.com"
        }, {
            "AccountName": "nascarjake",
            "DisplayName": "Flying314",
            "Email": ""
        }],
        "Dependencies": [{
            "Name": "Parent-Mod",
            "Version": {
                "Major": 0,
                "Minor": 0,
                "Revision": 0
            }
        }],
        "Categories": [
            "Automation",
            "Cosmetics",
            "Generation",
            "Library",
            "Magic",
            "Miscellaneous",
            "Nature",
            "Technology",
            "Utility"
        ],
        "Media": {
            "Videos": ["-HrwaxZbsnY"], //Array of youTube video IDs
            "Images": [{
                src: "http://tugfiles.nerdkingdom.com/www/img/survival-mode-1.jpg",
                caption: "This is a caption"
            }, {
                src: "http://tugfiles.nerdkingdom.com/www/img/survival-mode-2.jpg",
                caption: ""
            }] //Array of image urls
        },
        "Icon": "http://tugfiles.nerdkingdom.com/www/img/tug-logo.png",
        "WebPage": {
            "Sections": [{
                "Title": "Changes",
                "Headline": "To change or add sections, edit the mod\'s manifest.",
                "Icon": "forumbee",
                "Columns": "1",
                "Content": [{
                    "Type": "Paragraph",
                    "Value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dapibus arcu at dui congue iaculis. Morbi placerat lorem laoreet sem elementum, vel laoreet sem ultricies. Cras aliquam, libero molestie vehicula vulputate, dui est condimentum nisi, eget sodales erat sem sit amet lectus. Donec nec imperdiet felis, porttitor sollicitudin nulla. Donec ac vestibulum ligula. Nam cursus tristique massa, in tempus elit molestie a. Suspendisse metus dolor, cursus malesuada eros id, convallis bibendum magna. Nullam laoreet est ante, id ornare ante finibus non."
                }, {
                    "Type": "Paragraph",
                    "Value": "Etiam eget tincidunt nulla. Proin auctor iaculis mauris, vitae sollicitudin velit. Morbi et odio lorem. Donec in nisi a erat pellentesque porttitor. Nam risus neque, sagittis eget urna a, efficitur vulputate nibh. Duis et sem eu leo condimentum dictum. Mauris a gravida dui. Donec pretium tortor ut pellentesque pharetra. Quisque posuere aliquet massa eu ornare. Vivamus tincidunt massa ac erat commodo tempus. Nunc a dui sed nisl cursus tincidunt ac ut mauris. Nulla elementum non lectus sit amet fermentum. Nunc ac velit et orci vestibulum pharetra. Nullam nec enim eleifend, dignissim quam vel, tincidunt tellus. Donec vel commodo augue."
                }]
            }, {
                "Title": "Features",
                "Icon": "cubes",
                "Background": "rgba(255,255,255,.4",
                "Columns": "1",
                "Content": [{
                    "Type": "List",
                    "Items": ["Awesome Feature 1", "Spectacular Feature 2", "Wonderful Feature 3", "Crazy Feature 4", "Mind-bending Feature 5"]
                }]
            }, {
                "Title": "Instructions",
                "Icon": "wrench",
                "Columns": "1",
                "Content": [{
                    "Type": "Tabs",
                    "Items": [{
                        "Title": "Step 1",
                        "Icon": "bolt",
                        "Content": [{
                            "Type": "Paragraph",
                            "Value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dapibus arcu at dui congue iaculis. Morbi placerat lorem laoreet sem elementum, vel laoreet sem ultricies. Cras aliquam, libero molestie vehicula vulputate, dui est condimentum nisi, eget sodales erat sem sit amet lectus. Donec nec imperdiet felis, porttitor sollicitudin nulla. Donec ac vestibulum ligula. Nam cursus tristique massa, in tempus elit molestie a. Suspendisse metus dolor, cursus malesuada eros id, convallis bibendum magna. Nullam laoreet est ante, id ornare ante finibus non."
                        }, {
                            "Type": "Paragraph",
                            "Value": "Etiam eget tincidunt nulla. Proin auctor iaculis mauris, vitae sollicitudin velit. Morbi et odio lorem. Donec in nisi a erat pellentesque porttitor. Nam risus neque, sagittis eget urna a, efficitur vulputate nibh. Duis et sem eu leo condimentum dictum. Mauris a gravida dui. Donec pretium tortor ut pellentesque pharetra. Quisque posuere aliquet massa eu ornare. Vivamus tincidunt massa ac erat commodo tempus. Nunc a dui sed nisl cursus tincidunt ac ut mauris. Nulla elementum non lectus sit amet fermentum. Nunc ac velit et orci vestibulum pharetra. Nullam nec enim eleifend, dignissim quam vel, tincidunt tellus. Donec vel commodo augue."
                        }]
                    }, {
                        "Title": "Step 2",
                        "Icon": "rocket",
                        "Content": [{
                            "Type": "Paragraph",
                            "Value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dapibus arcu at dui congue iaculis. Morbi placerat lorem laoreet sem elementum, vel laoreet sem ultricies. Cras aliquam, libero molestie vehicula vulputate, dui est condimentum nisi, eget sodales erat sem sit amet lectus. Donec nec imperdiet felis, porttitor sollicitudin nulla. Donec ac vestibulum ligula. Nam cursus tristique massa, in tempus elit molestie a. Suspendisse metus dolor, cursus malesuada eros id, convallis bibendum magna. Nullam laoreet est ante, id ornare ante finibus non."
                        }, {
                            "Type": "Paragraph",
                            "Value": "Etiam eget tincidunt nulla. Proin auctor iaculis mauris, vitae sollicitudin velit. Morbi et odio lorem. Donec in nisi a erat pellentesque porttitor. Nam risus neque, sagittis eget urna a, efficitur vulputate nibh. Duis et sem eu leo condimentum dictum. Mauris a gravida dui. Donec pretium tortor ut pellentesque pharetra. Quisque posuere aliquet massa eu ornare. Vivamus tincidunt massa ac erat commodo tempus. Nunc a dui sed nisl cursus tincidunt ac ut mauris. Nulla elementum non lectus sit amet fermentum. Nunc ac velit et orci vestibulum pharetra. Nullam nec enim eleifend, dignissim quam vel, tincidunt tellus. Donec vel commodo augue."
                        }, {
                            "Type": "Paragraph",
                            "Value": "Etiam eget tincidunt nulla. Proin auctor iaculis mauris, vitae sollicitudin velit. Morbi et odio lorem. Donec in nisi a erat pellentesque porttitor. Nam risus neque, sagittis eget urna a, efficitur vulputate nibh. Duis et sem eu leo condimentum dictum. Mauris a gravida dui. Donec pretium tortor ut pellentesque pharetra. Quisque posuere aliquet massa eu ornare. Vivamus tincidunt massa ac erat commodo tempus. Nunc a dui sed nisl cursus tincidunt ac ut mauris. Nulla elementum non lectus sit amet fermentum. Nunc ac velit et orci vestibulum pharetra. Nullam nec enim eleifend, dignissim quam vel, tincidunt tellus. Donec vel commodo augue."
                        }]
                    }, {
                        "Title": "Step 3",
                        "Icon": "bullseye",
                        "Content": [{
                            "Type": "Paragraph",
                            "Value": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc dapibus arcu at dui congue iaculis. Morbi placerat lorem laoreet sem elementum, vel laoreet sem ultricies. Cras aliquam, libero molestie vehicula vulputate, dui est condimentum nisi, eget sodales erat sem sit amet lectus. Donec nec imperdiet felis, porttitor sollicitudin nulla. Donec ac vestibulum ligula. Nam cursus tristique massa, in tempus elit molestie a. Suspendisse metus dolor, cursus malesuada eros id, convallis bibendum magna. Nullam laoreet est ante, id ornare ante finibus non."
                        }]
                    }]
                }]
            }],
            "Theme": {
                "Name": "Nerd Kingdom",
                "Layout": "Scroll",
                "HideNavBar": false,
                "Primary": {
                    "Color": "#175ba5",
                    "Text": "#ffffff",
                    //"Image": "http://www.atableprovencale.com/wp-content/uploads/2013/04/Fleur-De-Lis-Pattern-Background-2-s5.png"
                },
                "Secondary": {
                    "Color": "#d7e1e7",
                    "Text": "#333333"
                },
                "Body": {
                    "Color": "#ecf0f1",
                    "Text": "#333333",
                    "Image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAATElEQVQYV2N8+e7jfwYoEBfiZ4SxYTRMnhFZIUgSl2IMhbgUg61CNxWbYribCClGcTw+xTh9iex7kAcxFOJyM9jX+MIPZjI8eAgpBgAi7zbuVcN9gQAAAABJRU5ErkJggg=="
                }
            }
            /*{
	    		"Primary": "#27ae60",
	    		"Secondary": "#2c3e50",
	    		"Background": "#ecf0f1",
	    		"Text": "#ffffff",
	    	}*/
        }
    };



    //init are you sure popup.
    setTimeout(function() {
        jQuery.noConflict()
        $('#aysPopup').modal({
            show: false
        })
        if ($scope.modManifest.WebPage) {
            $scope.system.setTheme();
        }
    }, 100)

    $scope.services.getManifest();

    //EMPTY INIT - This init needs to happen after the controller, but since the getManifest is ansync and may fail,
    //It has its own init and resolution. So this initializes the stub modManifest, incase the getManifest query dies
    setTimeout(function() {
        $scope.defaultSections.home.insertHeaderMedia()



        if ($scope.modManifest.Media.Images.length == 0) {
            $('.detailBox').addClass('medium-12');
        }

        //Show the first tab - must be done after document foundation call.
        $('.first').show();


        if ($scope.modManifest.WebPage) {
            $scope.system.setLayout();
            $scope.system.setTheme();
        }

        $(window).resize(function() {
            if ($scope.editOverlay.pane != "")
                $scope.editOverlay.resize()
        })
    }, 0)
})



//http://stackoverflow.com/questions/430237/is-it-possible-to-use-js-to-open-an-html-select-to-show-its-option-list
dropDown = function(dropdown) {
    try {
        showDropdown(dropdown);
    } catch (e) {

    }
    return false;
};

showDropdown = function(element) {
    var event;
    event = document.createEvent('MouseEvents');
    event.initMouseEvent('mousedown', true, true, window);
    element.dispatchEvent(event);
};
//end Stack overflow

String.prototype.firstWord = function() {
    if (this.indexOf(' ') < 0)
        return this;
    return this.substr(0, this.indexOf(' '));
}

String.prototype.lastWord = function() {
    if (this.lastIndexOf(' ') < 0)
        return this;
    return this.substr(this.lastIndexOf(' '));
}

String.prototype.toTitleCase = function() {
    return this.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
}

//Manual substring function for when css just wont do
String.prototype.limit = function(length) {
    if (this.length > length)
        return this.substr(0, length) + "..."
    return this
}

//clean objects of their angular object identifiers by stringifying and parseing them.
clean = function(obj) {
    return JSON.parse(JSON.stringify(obj));
}

//font-awesome class list
var icons = ["adjust", "adn", "align-center", "align-justify", "align-left", "align-right", "ambulance", "anchor", "android", "angellist", "angle-double-down", "angle-double-left", "angle-double-right", "angle-double-up", "angle-down", "angle-left", "angle-right", "angle-up", "apple", "archive", "area-chart", "arrow-circle-down", "arrow-circle-left", "arrow-circle-o-down", "arrow-circle-o-left", "arrow-circle-o-right", "arrow-circle-o-up", "arrow-circle-right", "arrow-circle-up", "arrow-down", "arrow-left", "arrow-right", "arrow-up", "arrows", "arrows-alt", "arrows-h", "arrows-v", "asterisk", "at", "automobile", "backward", "ban", "bank", "bar-chart", "bar-chart-o", "barcode", "bars", "bed", "beer", "behance", "behance-square", "bell", "bell-o", "bell-slash", "bell-slash-o", "bicycle", "binoculars", "birthday-cake", "bitbucket", "bitbucket-square", "bitcoin", "bold", "bolt", "bomb", "book", "bookmark", "bookmark-o", "briefcase", "btc", "bug", "building", "building-o", "bullhorn", "bullseye", "bus", "buysellads", "cab", "calculator", "calendar", "calendar-o", "camera", "camera-retro", "car", "caret-down", "caret-left", "caret-right", "caret-square-o-down", "caret-square-o-left", "caret-square-o-right", "caret-square-o-up", "caret-up", "cart-arrow-down", "cart-plus", "cc", "cc-amex", "cc-discover", "cc-mastercard", "cc-paypal", "cc-stripe", "cc-visa", "certificate", "chain", "chain-broken", "check", "check-circle", "check-circle-o", "check-square", "check-square-o", "chevron-circle-down", "chevron-circle-left", "chevron-circle-right", "chevron-circle-up", "chevron-down", "chevron-left", "chevron-right", "chevron-up", "child", "circle", "circle-o", "circle-o-notch", "circle-thin", "clipboard", "clock-o", "close", "cloud", "cloud-download", "cloud-upload", "cny", "code", "code-fork", "codepen", "coffee", "cog", "cogs", "columns", "comment", "comment-o", "comments", "comments-o", "compass", "compress", "connectdevelop", "copy", "copyright", "credit-card", "crop", "crosshairs", "css3", "cube", "cubes", "cut", "cutlery", "dashboard", "dashcube", "database", "dedent", "delicious", "desktop", "deviantart", "diamond", "digg", "dollar", "dot-circle-o", "download", "dribbble", "dropbox", "drupal", "edit", "eject", "ellipsis-h", "ellipsis-v", "empire", "envelope", "envelope-o", "envelope-square", "eraser", "eur", "euro", "exchange", "exclamation", "exclamation-circle", "exclamation-triangle", "expand", "external-link", "external-link-square", "eye", "eye-slash", "eyedropper", "facebook", "facebook-f", "facebook-official", "facebook-square", "fast-backward", "fast-forward", "fax", "female", "fighter-jet", "file", "file-archive-o", "file-audio-o", "file-code-o", "file-excel-o", "file-image-o", "file-movie-o", "file-o", "file-pdf-o", "file-photo-o", "file-picture-o", "file-powerpoint-o", "file-sound-o", "file-text", "file-text-o", "file-video-o", "file-word-o", "file-zip-o", "files-o", "film", "filter", "fire", "fire-extinguisher", "flag", "flag-checkered", "flag-o", "flash", "flask", "flickr", "floppy-o", "folder", "folder-o", "folder-open", "folder-open-o", "font", "forumbee", "forward", "foursquare", "frown-o", "futbol-o", "gamepad", "gavel", "gbp", "ge", "gear", "gears", "genderless", "gift", "git", "git-square", "github", "github-alt", "github-square", "gittip", "glass", "globe", "google", "google-plus", "google-plus-square", "google-wallet", "graduation-cap", "gratipay", "group", "h-square", "hacker-news", "hand-o-down", "hand-o-left", "hand-o-right", "hand-o-up", "hdd-o", "header", "headphones", "heart", "heart-o", "heartbeat", "history", "home", "hospital-o", "hotel", "html5", "ils", "image", "inbox", "indent", "info", "info-circle", "inr", "instagram", "institution", "ioxhost", "italic", "joomla", "jpy", "jsfiddle", "key", "keyboard-o", "krw", "language", "laptop", "lastfm", "lastfm-square", "leaf", "leanpub", "legal", "lemon-o", "level-down", "level-up", "life-bouy", "life-buoy", "life-ring", "life-saver", "lightbulb-o", "line-chart", "link", "linkedin", "linkedin-square", "linux", "list", "list-alt", "list-ol", "list-ul", "location-arrow", "lock", "long-arrow-down", "long-arrow-left", "long-arrow-right", "long-arrow-up", "magic", "magnet", "mail-forward", "mail-reply", "mail-reply-all", "male", "map-marker", "mars", "mars-double", "mars-stroke", "mars-stroke-h", "mars-stroke-v", "maxcdn", "meanpath", "medium", "medkit", "meh-o", "mercury", "microphone", "microphone-slash", "minus", "minus-circle", "minus-square", "minus-square-o", "mobile", "mobile-phone", "money", "moon-o", "mortar-board", "motorcycle", "music", "navicon", "neuter", "newspaper-o", "openid", "outdent", "pagelines", "paint-brush", "paper-plane", "paper-plane-o", "paperclip", "paragraph", "paste", "pause", "paw", "paypal", "pencil", "pencil-square", "pencil-square-o", "phone", "phone-square", "photo", "picture-o", "pie-chart", "pied-piper", "pied-piper-alt", "pinterest", "pinterest-p", "pinterest-square", "plane", "play", "play-circle", "play-circle-o", "plug", "plus", "plus-circle", "plus-square", "plus-square-o", "power-off", "print", "puzzle-piece", "qq", "qrcode", "question", "question-circle", "quote-left", "quote-right", "ra", "random", "rebel", "recycle", "reddit", "reddit-square", "refresh", "remove", "renren", "reorder", "repeat", "reply", "reply-all", "retweet", "rmb", "road", "rocket", "rotate-left", "rotate-right", "rouble", "rss", "rss-square", "rub", "ruble", "rupee", "save", "scissors", "search", "search-minus", "search-plus", "sellsy", "send", "send-o", "server", "share", "share-alt", "share-alt-square", "share-square", "share-square-o", "shekel", "sheqel", "shield", "ship", "shirtsinbulk", "shopping-cart", "sign-in", "sign-out", "signal", "simplybuilt", "sitemap", "skyatlas", "skype", "slack", "sliders", "slideshare", "smile-o", "soccer-ball-o", "sort", "sort-alpha-asc", "sort-alpha-desc", "sort-amount-asc", "sort-amount-desc", "sort-asc", "sort-desc", "sort-down", "sort-numeric-asc", "sort-numeric-desc", "sort-up", "soundcloud", "space-shuttle", "spinner", "spoon", "spotify", "square", "square-o", "stack-exchange", "stack-overflow", "star", "star-half", "star-half-empty", "star-half-full", "star-half-o", "star-o", "steam", "steam-square", "step-backward", "step-forward", "stethoscope", "stop", "street-view", "strikethrough", "stumbleupon", "stumbleupon-circle", "subscript", "subway", "suitcase", "sun-o", "superscript", "support", "table", "tablet", "tachometer", "tag", "tags", "tasks", "taxi", "tencent-weibo", "terminal", "text-height", "text-width", "th", "th-large", "th-list", "thumb-tack", "thumbs-down", "thumbs-o-down", "thumbs-o-up", "thumbs-up", "ticket", "times", "times-circle", "times-circle-o", "tint", "toggle-down", "toggle-left", "toggle-off", "toggle-on", "toggle-right", "toggle-up", "train", "transgender", "transgender-alt", "trash", "trash-o", "tree", "trello", "trophy", "truck", "try", "tty", "tumblr", "tumblr-square", "turkish-lira", "twitch", "twitter", "twitter-square", "umbrella", "underline", "undo", "university", "unlink", "unlock", "unlock-alt", "unsorted", "upload", "usd", "user", "user-md", "user-plus", "user-secret", "user-times", "users", "venus", "venus-double", "venus-mars", "viacoin", "video-camera", "vimeo-square", "vine", "vk", "volume-down", "volume-off", "volume-up", "warning", "wechat", "weibo", "weixin", "whatsapp", "wheelchair", "wifi", "windows", "won", "wordpress", "wrench", "xing", "xing-square", "yahoo", "yelp", "yen", "youtube", "youtube-play", "youtube-square"]
})();