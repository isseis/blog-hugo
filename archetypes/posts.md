---
title: "{{ replaceRE "^\\d\\d\\d\\d-\\d\\d-\\d\\d-" "" .Name | replaceRE "-" " " | title }}"
date: {{ .Date }}
slug: "{{ replaceRE "^\\d\\d\\d\\d-\\d\\d-\\d\\d-" "" .Name }}"
draft: true
---

