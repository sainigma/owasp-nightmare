from django.shortcuts import render, redirect

def heiMaailmaView(request):
	return render(request, 'testi.html')