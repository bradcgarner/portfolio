const showDetail = index => {
  console.log(index);
  const rootElement = document.getElementById('aboutCategory'+index);
  rootElement.getElementsByClassName("aboutDetail").classList.add('hidden');
  rootElement.getElementsByClassName('aboutDetail'+index).classList.remove('hidden');
};