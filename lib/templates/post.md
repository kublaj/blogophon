---
{{#draft}}
Draft:     yes # Remove this line to undraft this article
{{/draft}}
Date:      {{#ymlQuote}}{{{date}}}{{/ymlQuote}}
{{#tags}}
Tags:      {{#ymlQuote}}{{{tags}}}{{/ymlQuote}}
{{/tags}}
{{#category}}
Category:  {{#ymlQuote}}{{{category}}}{{/ymlQuote}}
{{/category}}
{{#classes}}
Classes:   {{#ymlQuote}}{{{classes}}}{{/ymlQuote}}
{{/classes}}
{{#author}}
Author:    {{#ymlQuote}}{{{author}}}{{/ymlQuote}}
{{/author}}
{{^isMicropost}}
Twitter:   {{#ymlQuote}}{{{title}}}{{/ymlQuote}}
{{/isMicropost}}
{{#location}}
Location:  {{#ymlQuote}}{{{location}}}{{/ymlQuote}}
{{/location}}
{{#latitude}}
Marker:    marker
Latitude:  {{#ymlQuote}}{{{latitude}}}{{/ymlQuote}}
Longitude: {{#ymlQuote}}{{{longitude}}}{{/ymlQuote}}
{{/latitude}}
{{#rating}}
Rating:    {{#ymlQuote}}{{rating}}/5{{/ymlQuote}}
{{/rating}}
{{#link}}
Link:      {{#ymlQuote}}{{{link}}}{{/ymlQuote}}
{{/link}}
---

{{^isMicropost}}
{{{title}}}
=========

{{#lead}}
{{{lead}}}

***

{{/lead}}
{{/isMicropost}}
{{{mainText}}}
