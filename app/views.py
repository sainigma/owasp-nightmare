import json
from django.contrib import auth
from django.http import HttpResponse
from django.db.models import Q
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.utils import timezone
from .models import Message

default_cmd = [
	'Welcome to a very secure messaging server!','','Not logged in','type `login username password` to login'
]

def mainView(request):
	result = default_cmd
	if 'user' in request.session:
		result = [f"Welcome back, {request.session['user']}!", 'type `help` for available commands']
	return render(request, 'index.html', {'cmdhistory':result})

def getRoute(request):
	if request.method != 'POST':
		return redirect('/')
	result = {}
	if 'user' in request.session:
		messages = []
		for message in Message.objects.all().filter(Q(target=request.session['user']) | Q(sender=request.session['user'])).order_by('-timestamp')[:50]:
			messages.append([message.sender, message.content, str(message.timestamp)[:19], message.target])

		result = {
			'success':True,
			'messages':messages
		}
	return HttpResponse(json.dumps(result), content_type="application/json")
	
def loginRoute(request):
	if request.method == 'POST':
		username = request.POST.get('username')
		password = request.POST.get('password')
		result = {'success':True,'username':username}
		user = authenticate(username=username, password=password)
		if user is None:
			result = {'error':'password'}
			try:
				if User.objects.get(username=username):
					pass
			except:
				result = {'error':'username'}
		else:
			request.session['user'] = username
		return HttpResponse(json.dumps(result), content_type="application/json")
	return redirect('/')

def logoutRoute(request):
	response = {}
	if 'user' in request.session:
		del request.session['user']
		response = {'success':True}
	return HttpResponse(json.dumps(response), content_type="application/json")

def createRoute(request):
	if request.method == 'POST':
		username = request.POST.get('username')
		password = request.POST.get('password')
		userExists = True
		try:
			if User.objects.get(username=username):
				pass
		except:
			userExists = False

		result = {}
		if not userExists:
			user = User.objects.create_user(username, '', password)
			result['success'] = True
		return HttpResponse(json.dumps(result), content_type="application/json")
	return redirect('/')

def sendRoute(request):
	if request.method == 'POST' and 'user' in request.session:
		target = request.POST.get('target')
		msg = request.POST.get('msg')
		print(target, msg)
		if target and msg:
			message = Message(sender=request.session['user'], target=target, content=msg, timestamp=timezone.now())
			message.save()
			return HttpResponse(json.dumps({'success':True}), content_type="application/json")
	return redirect('/')